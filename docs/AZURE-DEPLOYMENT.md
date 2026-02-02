# Déploiement Azure - SnapQuiz

Ce guide explique comment déployer SnapQuiz sur Azure Web App for Containers.

## Prérequis

1. **Compte Azure** avec un abonnement actif
2. **Azure CLI** installé localement
3. **GitHub repository** avec les secrets configurés

## Architecture de déploiement

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure                                     │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────┐ │
│  │  Azure Web App  │   │ Azure Database  │   │ Azure AI      │ │
│  │  for Containers │◄──│ for PostgreSQL  │   │ Foundry       │ │
│  │  (SnapQuiz)     │   │ (Flexible)      │   │ (LLM Models)  │ │
│  └────────┬────────┘   └─────────────────┘   └───────────────┘ │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ GitHub Container│                                            │
│  │ Registry (ghcr) │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Azure

### 1. Créer les ressources Azure

```bash
# Variables
RESOURCE_GROUP="rg-snapquiz"
LOCATION="westeurope"
WEBAPP_NAME="snapquiz"
PLAN_NAME="plan-snapquiz"

# Créer le resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Créer un App Service Plan (Linux)
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B1

# Créer la Web App
az webapp create \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --deployment-container-image-name ghcr.io/gitjpk/snapquiz:latest
```

### 2. Configurer la base de données PostgreSQL

```bash
# Créer le serveur PostgreSQL
az postgres flexible-server create \
  --name snapquiz-db \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user snapquizadmin \
  --admin-password <votre-mot-de-passe> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32

# Créer la base de données
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name snapquiz-db \
  --database-name snapquiz
```

### 3. Configurer les variables d'environnement

```bash
az webapp config appsettings set \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    DATABASE_URL="postgresql://snapquizadmin:<password>@snapquiz-db.postgres.database.azure.com:5432/snapquiz?sslmode=require" \
    AUTH_PASSWORD="<votre-mot-de-passe-admin>" \
    AUTH_SESSION_SECRET="<secret-32-chars-min>" \
    LLM_KEY_ENCRYPTION_SECRET="<64-hex-chars>" \
    USE_HTTPS_COOKIES="true" \
    WEBSITES_PORT="8080"
```

### 4. Configurer GitHub Actions

#### Créer les credentials Azure

```bash
# Créer un Service Principal
az ad sp create-for-rbac \
  --name "snapquiz-github-actions" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth
```

Copiez le JSON généré.

#### Ajouter les secrets GitHub

Dans votre repository GitHub → Settings → Secrets and variables → Actions :

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | Le JSON complet du Service Principal |

### 5. Configurer l'accès au Container Registry

```bash
# Activer l'authentification avec GitHub Container Registry
az webapp config container set \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-registry-server-url https://ghcr.io \
  --docker-registry-server-user $GITHUB_USERNAME \
  --docker-registry-server-password $GITHUB_TOKEN
```

## Déploiement

### Déploiement automatique

Le workflow GitHub Actions se déclenche automatiquement lors d'un push sur `main` ou `opus`.

### Déploiement manuel

```bash
# Depuis la page Actions de votre repository
# Cliquez sur "Deploy to Azure Web App"
# Cliquez sur "Run workflow"
```

### Déploiement local (test)

```bash
# Build l'image Docker
docker build -t snapquiz:local .

# Lancer localement
docker run -p 8080:8080 \
  -e DATABASE_URL="file:./dev.db" \
  -e AUTH_PASSWORD="test" \
  -e AUTH_SESSION_SECRET="test-secret-32-chars-minimum!!" \
  -e LLM_KEY_ENCRYPTION_SECRET="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" \
  snapquiz:local
```

## Migration de la base de données

Après le premier déploiement, exécutez les migrations :

```bash
# Se connecter à la Web App via SSH
az webapp ssh --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP

# Dans le conteneur
npx prisma migrate deploy
```

## Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://...` |
| `AUTH_PASSWORD` | Mot de passe admin | `MonMotDePasse123!` |
| `AUTH_SESSION_SECRET` | Secret pour les sessions (min 32 chars) | `super-secret-key-...` |
| `LLM_KEY_ENCRYPTION_SECRET` | Clé de chiffrement AES-256 (64 hex) | `0123456789abcdef...` |
| `USE_HTTPS_COOKIES` | Activer les cookies sécurisés | `true` |
| `WEBSITES_PORT` | Port d'écoute (Azure) | `8080` |

## Monitoring

### Logs

```bash
# Voir les logs en temps réel
az webapp log tail --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP

# Activer les logs
az webapp log config \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-container-logging filesystem
```

### Health Check

L'application expose un endpoint de santé : `/api/auth/status`

## Coûts estimés

| Ressource | SKU | Coût mensuel estimé |
|-----------|-----|---------------------|
| App Service Plan | B1 | ~13€ |
| PostgreSQL Flexible | B1ms | ~15€ |
| Azure AI Foundry | Pay-as-you-go | Variable |
| **Total** | | **~30€/mois + LLM** |

## Troubleshooting

### L'application ne démarre pas

1. Vérifier les logs : `az webapp log tail ...`
2. Vérifier les variables d'environnement
3. Vérifier que la base de données est accessible

### Erreur de connexion à la base de données

1. Vérifier que le firewall PostgreSQL autorise Azure Services
2. Vérifier l'URL de connexion avec `sslmode=require`

### Erreur de déploiement GitHub Actions

1. Vérifier les secrets GitHub
2. Vérifier les permissions du Service Principal
3. Vérifier que le Container Registry est accessible
