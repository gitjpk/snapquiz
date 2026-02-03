# Feature Specification: Multi-Host Accounts

**Feature Branch**: `005-multi-host-accounts`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: User description: "J'aimerais rendre l'app accessible par plusieurs 'formateurs' (host), et que chacun puisse avoir son espace avec les quiz."

## Overview

Cette fonctionnalité transforme SnapQuiz d'une application mono-utilisateur en une plateforme multi-formateurs. Chaque formateur (host) dispose de son propre espace isolé avec ses quiz, ses sessions, et ses paramètres LLM.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inscription d'un nouveau formateur (Priority: P1)

Un nouveau formateur souhaite créer son compte pour utiliser SnapQuiz avec ses propres quiz.

**Why this priority**: Sans inscription, aucun nouveau formateur ne peut accéder à la plateforme. C'est le point d'entrée obligatoire.

**Independent Test**: Un utilisateur peut s'inscrire, se connecter et accéder à un tableau de bord vide prêt à créer des quiz.

**Acceptance Scenarios**:

1. **Given** je suis sur la page d'accueil, **When** je clique sur "S'inscrire", **Then** je vois un formulaire d'inscription
2. **Given** le formulaire d'inscription, **When** je remplis email/mot de passe valides et soumets, **Then** mon compte est créé et je suis redirigé vers mon tableau de bord
3. **Given** le formulaire d'inscription, **When** je soumets un email déjà utilisé, **Then** je vois un message d'erreur "Cet email est déjà utilisé"
4. **Given** le formulaire d'inscription, **When** je soumets un mot de passe trop faible, **Then** je vois les critères de sécurité requis

---

### User Story 2 - Connexion d'un formateur existant (Priority: P1)

Un formateur existant veut se connecter pour accéder à ses quiz.

**Why this priority**: La connexion est aussi critique que l'inscription pour l'accès à la plateforme.

**Independent Test**: Un formateur peut se connecter et retrouver tous ses quiz existants.

**Acceptance Scenarios**:

1. **Given** je suis sur la page de connexion, **When** j'entre des identifiants valides, **Then** je suis connecté et redirigé vers mon tableau de bord
2. **Given** je suis sur la page de connexion, **When** j'entre un mot de passe incorrect, **Then** je vois "Email ou mot de passe incorrect"
3. **Given** je suis connecté, **When** ma session expire, **Then** je suis redirigé vers la page de connexion

---

### User Story 3 - Isolation des données par formateur (Priority: P1)

Chaque formateur ne voit que ses propres quiz et sessions. Aucun accès aux données d'autres formateurs.

**Why this priority**: L'isolation des données est fondamentale pour une plateforme multi-utilisateurs. Sans elle, les données seraient mélangées entre formateurs.

**Independent Test**: Créer 2 comptes formateurs, chacun avec des quiz. Vérifier que chaque formateur ne voit que ses propres quiz.

**Acceptance Scenarios**:

1. **Given** je suis le formateur A avec 3 quiz, **When** le formateur B se connecte, **Then** le formateur B ne voit aucun de mes quiz
2. **Given** je suis le formateur A, **When** j'essaie d'accéder à l'URL d'un quiz du formateur B, **Then** je reçois une erreur 404 ou "Non autorisé"
3. **Given** je suis le formateur A, **When** je crée une session de quiz, **Then** cette session est associée uniquement à mon compte

---

### User Story 4 - Paramètres LLM par formateur (Priority: P2)

Chaque formateur peut configurer sa propre clé API LLM pour la génération de quiz IA.

**Why this priority**: Permet à chaque formateur d'utiliser son propre quota/budget LLM. Important pour l'autonomie mais pas bloquant pour le MVP.

**Independent Test**: Deux formateurs configurent des clés API différentes et génèrent des quiz indépendamment.

**Acceptance Scenarios**:

1. **Given** je suis connecté comme formateur, **When** je vais dans les paramètres LLM, **Then** je peux configurer ma propre clé API
2. **Given** j'ai configuré ma clé API, **When** je génère un quiz par IA, **Then** ma clé API est utilisée (pas celle d'un autre formateur)
3. **Given** je n'ai pas configuré de clé API, **When** j'essaie de générer un quiz IA, **Then** je vois un message m'invitant à configurer mes paramètres LLM

---

### User Story 5 - Mot de passe oublié (Priority: P2)

Un formateur qui a oublié son mot de passe peut le réinitialiser.

**Why this priority**: Fonctionnalité standard attendue, mais pas critique pour le MVP initial.

**Independent Test**: Un formateur peut demander une réinitialisation et définir un nouveau mot de passe.

**Acceptance Scenarios**:

1. **Given** je suis sur la page de connexion, **When** je clique "Mot de passe oublié", **Then** je peux entrer mon email
2. **Given** j'ai demandé une réinitialisation, **When** je reçois l'email, **Then** le lien me permet de définir un nouveau mot de passe
3. **Given** j'ai un lien de réinitialisation, **When** le lien a expiré (>1h), **Then** je vois un message d'expiration

---

### User Story 6 - Profil formateur (Priority: P3)

Un formateur peut personnaliser son profil (nom affiché, avatar optionnel).

**Why this priority**: Nice-to-have pour la personnalisation, non essentiel au fonctionnement.

**Independent Test**: Un formateur peut modifier son nom affiché et le voir dans l'interface.

**Acceptance Scenarios**:

1. **Given** je suis connecté, **When** je vais sur mon profil, **Then** je peux modifier mon nom d'affichage
2. **Given** j'ai modifié mon nom, **When** je crée un quiz, **Then** mon nouveau nom apparaît comme auteur

---

### Edge Cases

- Que se passe-t-il si un formateur supprime son compte ? (Les quiz et sessions sont archivés ou supprimés ?)
- Comment gérer les sessions actives si un formateur se déconnecte ?
- Un formateur peut-il avoir plusieurs sessions de navigateur simultanées ?
- Limite du nombre de quiz par formateur ? (pour éviter les abus)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre l'inscription via email et mot de passe
- **FR-002**: Le système DOIT valider la force du mot de passe (min 8 caractères, 1 majuscule, 1 chiffre)
- **FR-003**: Le système DOIT confirmer l'email via un lien de vérification
- **FR-004**: Le système DOIT permettre la connexion via email/mot de passe
- **FR-005**: Le système DOIT isoler complètement les données entre formateurs (quiz, sessions, participants, paramètres)
- **FR-006**: Le système DOIT associer chaque quiz à un seul formateur propriétaire
- **FR-007**: Le système DOIT rejeter toute tentative d'accès aux ressources d'un autre formateur
- **FR-008**: Le système DOIT permettre à chaque formateur de configurer ses propres paramètres LLM
- **FR-009**: Le système DOIT permettre la réinitialisation de mot de passe par email
- **FR-010**: Le système DOIT invalider les sessions après 7 jours d'inactivité
- **FR-011**: Le système DOIT permettre la déconnexion (suppression du token de session)
- **FR-012**: Le système DOIT hasher les mots de passe avant stockage (bcrypt)

### Key Entities

- **Host (Formateur)**: Représente un utilisateur formateur avec email, mot de passe hashé, nom d'affichage, et date de création
- **Quiz**: Appartient à un seul Host (relation many-to-one). Un formateur peut avoir plusieurs quiz
- **Session**: Appartient au quiz qui lui-même appartient à un Host. Hérite l'ownership
- **LLMSettings**: Associé à un Host spécifique (relation one-to-one)
- **PasswordResetToken**: Token temporaire lié à un Host pour la réinitialisation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un nouveau formateur peut s'inscrire et créer son premier quiz en moins de 5 minutes
- **SC-002**: Aucune donnée d'un formateur ne doit être visible par un autre formateur (isolation 100%)
- **SC-003**: Le système supporte au moins 100 formateurs simultanés sans dégradation
- **SC-004**: La connexion/déconnexion s'effectue en moins de 2 secondes
- **SC-005**: 99% des utilisateurs réussissent leur première connexion sans erreur

## Assumptions

- L'email sera utilisé comme identifiant unique (pas de username séparé)
- Un formateur = un compte email (pas de comptes partagés)
- Les formateurs existants (si migration) seront invités à créer un mot de passe
- L'envoi d'emails utilise un service externe (SMTP ou API comme SendGrid/Resend)

## Out of Scope

- Authentification OAuth (Google, Microsoft) - peut être ajouté plus tard
- Rôles multiples (admin vs formateur) - une seule classe d'utilisateur pour l'instant
- Partage de quiz entre formateurs
- Facturation/abonnements
- Équipes/organisations de formateurs
