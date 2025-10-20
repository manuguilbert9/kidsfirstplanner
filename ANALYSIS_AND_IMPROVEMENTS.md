# Analyse de l'Application et Plan d'Amélioration

## 📊 État Actuel de l'Application

### Structure du Flux Utilisateur

```
1. Page Login (/login)
   └─> Authentification Google
       └─> 2. Page Group Setup (/groups/setup)
           └─> Créer OU Rejoindre un groupe
               └─> 3. Dashboard Principal (/)
                   └─> Calendrier de garde
```

### Collections Firestore

```
users/{userId}
├── groupId: string
├── parentRole: "Parent 1" | "Parent 2"
├── color: string (HSL)
└── displayName: string

groups/{groupId}
├── name: string
├── members: string[] (UIDs)
├── recurringSchedule: {
│   ├── alternatingWeekDay: number (1-7)
│   ├── handoverTime: string ("HH:mm")
│   ├── parentA: "Parent 1" | "Parent 2"
│   ├── parentB: "Parent 1" | "Parent 2"
│   └── startDate: Timestamp
│   }
└── custodyOverrides: Array<Override>
```

---

## ❌ Problèmes Identifiés

### 1. **Flux Non Explicite**
- ❌ L'utilisateur ne comprend pas pourquoi il doit créer/rejoindre un groupe
- ❌ Pas d'explication sur ce qui va se passer ensuite
- ❌ Aucune preview du résultat final

### 2. **Configuration du Planning Manquante**
- ❌ Le calendrier apparaît VIDE après la création du groupe
- ❌ Pas de wizard pour configurer le planning initial
- ❌ L'utilisateur ne sait pas comment commencer

### 3. **Terminologie Confuse**
- ❌ "Parent 1" et "Parent 2" ne sont pas intuitifs
- ❌ "Group" n'est pas clair (pourquoi un groupe ?)
- ❌ "Alternating Week Day" n'est pas explicite

### 4. **Manque de Feedback Visuel**
- ❌ Pas d'indicateur de progression dans le flux
- ❌ Pas d'états vides avec instructions
- ❌ Peu de messages de succès/erreur clairs

### 5. **Logique Complexe et Éparpillée**
- ❌ Calcul des gardes dans le composant (150 lignes)
- ❌ Logique métier mélangée avec le UI
- ❌ Difficile à tester et maintenir

### 6. **Expérience Mobile Limitée**
- ❌ Interface adaptative mais pas optimisée
- ❌ Petites zones tactiles
- ❌ Navigation peu intuitive

---

## ✅ Améliorations Proposées

### Phase 1 : Amélioration du Flux d'Onboarding

#### 1.1 Ajouter un Wizard de Configuration Initiale

**Nouveau flux :**
```
Login → Group Setup → 📍 Schedule Setup Wizard → Calendar
```

**Étapes du Wizard :**

**Étape 1/4 : Informations de Base**
- "Comment souhaitez-vous être appelé dans l'application ?"
- Input : Prénom (au lieu de "Parent 1")
- "Comment s'appelle l'autre parent ?"
- Input : Prénom de l'autre parent

**Étape 2/4 : Configuration du Planning**
- "Quand commence votre planning d'alternance ?"
- Input : Date de début
- "Qui a les enfants la première semaine ?"
- Selection : Vous OU L'autre parent

**Étape 3/4 : Jours et Horaires de Passation**
- "Quel jour de la semaine se fait le changement de garde ?"
- Selection : Lundi, Mardi, ..., Dimanche
- "À quelle heure ?"
- Input : Heure (18:00 par défaut)

**Étape 4/4 : Confirmation**
- Résumé visuel du planning
- Preview du premier mois
- Bouton "Démarrer"

#### 1.2 Améliorer la Page Group Setup

**Avant :**
```
Deux cartes côte à côte sans contexte
```

**Après :**
```
┌─────────────────────────────────────────────┐
│  🤝 Partagez votre calendrier de coparentalité │
│                                               │
│  Ce calendrier sera partagé avec l'autre      │
│  parent pour faciliter l'organisation.        │
│                                               │
│  ┌──────────────┐  OU  ┌──────────────┐      │
│  │  Créer       │      │  Rejoindre   │      │
│  └──────────────┘      └──────────────┘      │
└─────────────────────────────────────────────┘
```

### Phase 2 : Simplification de la Terminologie

#### 2.1 Remplacer "Parent 1" / "Parent 2"

**Avant :**
```typescript
parentRole: "Parent 1" | "Parent 2"
```

**Après :**
```typescript
// Utiliser les vrais prénoms partout
displayName: string // "Marie" au lieu de "Parent 1"
```

#### 2.2 Vocabulaire Plus Clair

| Avant | Après |
|-------|-------|
| Parent 1, Parent 2 | Utiliser les prénoms |
| Alternating Week Day | Jour de changement de garde |
| Handover | Passation/Échange |
| Override | Exception au planning |
| Recurring Schedule | Planning habituel |

### Phase 3 : États Vides et Feedback

#### 3.1 État Vide du Calendrier

Quand aucun planning n'est configuré :

```
┌─────────────────────────────────────────┐
│        📅 Calendrier vide               │
│                                          │
│  Vous n'avez pas encore configuré       │
│  votre planning de garde.               │
│                                          │
│  ┌─────────────────────────┐            │
│  │ Configurer le planning  │            │
│  └─────────────────────────┘            │
└─────────────────────────────────────────┘
```

#### 3.2 Indicateur de Progression

Ajouter un stepper en haut :

```
Login ✓ → Groupe ✓ → Planning ⏳ → Calendrier
```

#### 3.3 Messages de Succès Améliorés

**Création de groupe :**
```
✅ Groupe créé !

Votre code : ABC123

Partagez ce code avec [NOM DE L'AUTRE PARENT]
pour qu'il/elle puisse rejoindre le groupe.

[Copier le code] [Continuer]
```

### Phase 4 : Refactoring de la Logique

#### 4.1 Créer un Hook Dédié : `useSchedule`

**Nouveau fichier : `src/hooks/use-schedule.ts`**

```typescript
export function useSchedule() {
  // Centralise toute la logique de calcul
  const calculateCustodyForDate = (date: Date) => {...}
  const getHandoverEvents = (range: DateRange) => {...}
  const getDailyEvents = (date: Date) => {...}

  return {
    calculateCustodyForDate,
    getHandoverEvents,
    getDailyEvents,
    isHandoverDay,
    getCurrentParent
  }
}
```

#### 4.2 Simplifier le Composant Calendrier

**Avant : 400+ lignes**
**Après : ~150 lignes**

Extraire :
- Logique de calcul → `useSchedule`
- Génération d'événements → `schedule-utils.ts`
- Rendering des cartes → Composants séparés

### Phase 5 : Amélioration de l'Expérience Mobile

#### 5.1 Navigation Simplifiée

Ajouter un bottom navigation sur mobile :

```
[Calendrier] [Planning] [Profil]
```

#### 5.2 Zones Tactiles Plus Grandes

- Augmenter la taille des boutons
- Espacer les éléments cliquables
- Améliorer le scroll

### Phase 6 : Fonctionnalités Manquantes

#### 6.1 Notifications (Futur)

- Rappel 24h avant une passation
- Notification de modification du planning

#### 6.2 Export (Futur)

- Exporter vers Google Calendar
- Exporter vers iCal
- PDF du mois

---

## 🎯 Plan d'Implémentation Recommandé

### Sprint 1 : Fondations (Cette session)

1. ✅ Créer le wizard de configuration initial
2. ✅ Refactorer la terminologie (prénoms au lieu de Parent 1/2)
3. ✅ Ajouter les états vides
4. ✅ Améliorer les messages de feedback

### Sprint 2 : Refactoring (Prochaine session)

1. Extraire la logique dans `useSchedule`
2. Créer `schedule-utils.ts`
3. Simplifier les composants
4. Ajouter des tests

### Sprint 3 : UX Mobile (Optionnel)

1. Navigation bottom
2. Améliorer les interactions tactiles
3. Optimiser les performances

---

## 📝 Modifications de Structure Proposées

### Nouveaux Fichiers à Créer

```
src/
├── app/
│   └── schedule-setup/      [NOUVEAU]
│       └── page.tsx         (Wizard de configuration)
├── components/
│   ├── onboarding/          [NOUVEAU]
│   │   ├── schedule-wizard.tsx
│   │   ├── wizard-step.tsx
│   │   └── progress-indicator.tsx
│   ├── schedule/
│   │   ├── empty-state.tsx  [NOUVEAU]
│   │   └── schedule-preview.tsx [NOUVEAU]
└── hooks/
    └── use-schedule.ts      [NOUVEAU]
└── lib/
    └── schedule-utils.ts    [NOUVEAU]
```

### Modifications de Données

**Collection `groups` - Ajouter :**
```typescript
{
  ...existing,
  parentNames: {
    parent1: string,  // "Marie" au lieu de juste le role
    parent2: string   // "Pierre"
  },
  setupCompleted: boolean,  // Flag pour savoir si le wizard est terminé
}
```

---

## 🚀 Commençons !

**Quelle phase souhaitez-vous que j'implémente en priorité ?**

A. Sprint 1 complet (Wizard + Terminologie + États vides)
B. Juste le Wizard de configuration
C. Juste le refactoring de la terminologie
D. Votre propre priorisation

Dites-moi et je commence l'implémentation ! 💪
