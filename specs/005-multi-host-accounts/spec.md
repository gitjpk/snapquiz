# Feature Specification: Multi-Host Accounts

**Feature Branch**: `005-multi-host-accounts`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: User description: "J'aimerais rendre l'app accessible par plusieurs 'formateurs' (host), et que chacun puisse avoir son espace avec les quiz."

## Overview

Cette fonctionnalité transforme SnapQuiz d'une application mono-utilisateur en une plateforme multi-formateurs. Chaque formateur (host) dispose de son propre espace isolé avec ses quiz, ses sessions, et ses paramètres LLM.

L'authentification se fait via **Microsoft Entra ID (OAuth 2.0)**, permettant aux formateurs de se connecter avec leur compte Microsoft professionnel ou personnel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connexion via Microsoft (Priority: P1)

Un formateur souhaite se connecter à SnapQuiz en utilisant son compte Microsoft.

**Why this priority**: L'authentification est le point d'entrée obligatoire. Microsoft Entra ID simplifie l'onboarding (pas de mot de passe à créer/mémoriser).

**Independent Test**: Un utilisateur peut se connecter via Microsoft et accéder à son tableau de bord.

**Acceptance Scenarios**:

1. **Given** je suis sur la page d'accueil, **When** je clique sur "Se connecter avec Microsoft", **Then** je suis redirigé vers la page de connexion Microsoft
2. **Given** la page Microsoft, **When** j'entre mes identifiants Microsoft valides, **Then** je suis redirigé vers mon tableau de bord SnapQuiz
3. **Given** c'est ma première connexion, **When** je me connecte avec succès, **Then** mon compte formateur est automatiquement créé
4. **Given** je me suis déjà connecté avant, **When** je me reconnecte, **Then** je retrouve tous mes quiz existants
5. **Given** la page Microsoft, **When** j'annule la connexion, **Then** je reviens sur la page d'accueil avec un message explicatif

---

### User Story 2 - Isolation des données par formateur (Priority: P1)

Chaque formateur ne voit que ses propres quiz et sessions. Aucun accès aux données d'autres formateurs.

**Why this priority**: L'isolation des données est fondamentale pour une plateforme multi-utilisateurs. Sans elle, les données seraient mélangées entre formateurs.

**Independent Test**: Créer 2 comptes formateurs, chacun avec des quiz. Vérifier que chaque formateur ne voit que ses propres quiz.

**Acceptance Scenarios**:

1. **Given** je suis le formateur A avec 3 quiz, **When** le formateur B se connecte, **Then** le formateur B ne voit aucun de mes quiz
2. **Given** je suis le formateur A, **When** j'essaie d'accéder à l'URL d'un quiz du formateur B, **Then** je reçois une erreur 404 ou "Non autorisé"
3. **Given** je suis le formateur A, **When** je crée une session de quiz, **Then** cette session est associée uniquement à mon compte

---

### User Story 3 - Paramètres LLM par formateur (Priority: P2)

Chaque formateur peut configurer sa propre clé API LLM pour la génération de quiz IA.

**Why this priority**: Permet à chaque formateur d'utiliser son propre quota/budget LLM. Important pour l'autonomie mais pas bloquant pour le MVP.

**Independent Test**: Deux formateurs configurent des clés API différentes et génèrent des quiz indépendamment.

**Acceptance Scenarios**:

1. **Given** je suis connecté comme formateur, **When** je vais dans les paramètres LLM, **Then** je peux configurer ma propre clé API
2. **Given** j'ai configuré ma clé API, **When** je génère un quiz par IA, **Then** ma clé API est utilisée (pas celle d'un autre formateur)
3. **Given** je n'ai pas configuré de clé API, **When** j'essaie de générer un quiz IA, **Then** je vois un message m'invitant à configurer mes paramètres LLM

---

### User Story 4 - Déconnexion (Priority: P2)

Un formateur connecté souhaite se déconnecter de l'application.

**Why this priority**: Fonctionnalité standard de sécurité.

**Independent Test**: Un formateur peut se déconnecter et doit se reconnecter pour accéder à son espace.

**Acceptance Scenarios**:

1. **Given** je suis connecté, **When** je clique sur "Déconnexion", **Then** ma session est terminée et je suis redirigé vers la page d'accueil
2. **Given** je viens de me déconnecter, **When** j'essaie d'accéder à /host/quizzes, **Then** je suis redirigé vers la page de connexion

---

### User Story 5 - Profil formateur (Priority: P3)

Un formateur peut voir son profil (nom, email depuis Microsoft).

**Why this priority**: Nice-to-have pour la personnalisation, non essentiel au fonctionnement. Le profil est principalement alimenté par Microsoft.

**Independent Test**: Un formateur peut voir son nom et email récupérés de Microsoft.

**Acceptance Scenarios**:

1. **Given** je suis connecté, **When** je vais sur mon profil, **Then** je vois mon nom et email Microsoft
2. **Given** je suis connecté, **When** je regarde la navbar, **Then** je vois mon nom ou avatar Microsoft

---

### Edge Cases

- Que se passe-t-il si Microsoft Entra ID est temporairement indisponible ?
- Comment gérer un utilisateur qui révoque l'accès SnapQuiz dans son compte Microsoft ?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre la connexion via Microsoft Entra ID (OAuth 2.0 / OpenID Connect)
- **FR-002**: Le système DOIT créer automatiquement un compte formateur à la première connexion Microsoft
- **FR-003**: Le système DOIT récupérer le nom et email depuis le profil Microsoft
- **FR-004**: Le système DOIT utiliser l'identifiant Microsoft (oid) comme identifiant unique du formateur
- **FR-005**: Le système DOIT isoler complètement les données entre formateurs (quiz, sessions, participants, paramètres)
- **FR-006**: Le système DOIT associer chaque quiz à un seul formateur propriétaire
- **FR-007**: Le système DOIT rejeter toute tentative d'accès aux ressources d'un autre formateur
- **FR-008**: Le système DOIT permettre à chaque formateur de configurer ses propres paramètres LLM
- **FR-009**: Le système DOIT maintenir une session côté serveur après authentification OAuth
- **FR-010**: Le système DOIT permettre la déconnexion (invalidation de la session locale)
- **FR-011**: Le système DOIT rediriger vers Microsoft login si la session est expirée ou invalide

### Key Entities

- **Host (Formateur)**: Représente un utilisateur formateur avec microsoftId (oid), email, nom d'affichage, et date de création
- **Quiz**: Appartient à un seul Host (relation many-to-one). Un formateur peut avoir plusieurs quiz
- **Session**: Appartient au quiz qui lui-même appartient à un Host. Hérite l'ownership
- **LLMSettings**: Associé à un Host spécifique (relation one-to-one)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un nouveau formateur peut s'inscrire et créer son premier quiz en moins de 5 minutes
- **SC-002**: Aucune donnée d'un formateur ne doit être visible par un autre formateur (isolation 100%)
- **SC-003**: Le système supporte au moins 100 formateurs simultanés sans dégradation
- **SC-004**: La connexion/déconnexion s'effectue en moins de 2 secondes
- **SC-005**: 99% des utilisateurs réussissent leur première connexion sans erreur

## Assumptions

- L'identifiant Microsoft (oid claim) sera utilisé comme identifiant unique du formateur
- Un formateur = un compte Microsoft (pas de comptes partagés)
- L'application sera enregistrée dans Microsoft Entra ID (Azure AD)
- Les scopes demandés : openid, profile, email
- Le flow OAuth utilisé : Authorization Code Flow avec PKCE

## Out of Scope

- Authentification email/mot de passe (remplacée par Microsoft OAuth)
- Autres providers OAuth (Google, GitHub) - Microsoft uniquement pour le MVP
- Rôles multiples (admin vs formateur) - une seule classe d'utilisateur pour l'instant
- Partage de quiz entre formateurs
- Facturation/abonnements
- Équipes/organisations de formateurs
- Restriction par tenant Microsoft (tous les comptes Microsoft acceptés)
