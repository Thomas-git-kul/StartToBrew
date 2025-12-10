# StartToBrew

**_A guided app that helps amateur brewers confidently craft their first beers._**

## Project description

StartToBrew is a SaaS app designed for beginner homebrewers who want to learn beer brewing in a structured, enjoyable, and stress-free way. It offers step-by-step guidance, timers, progress tracking, and motivational design principles to help users succeed in brewing their first batches at home.

### Features

- **Guided Brewing Experience** – Step-by-step instructions from boiling to bottling

- **Webshop** - Users can buy their first starter kit along with more materials/ingredients

- **Timers & Notifications** – Reminders for brewing and fermentation checkpoints

- **Brew Tracking Dashboard** – Log batches, track results, and review performance

- **Progress Motivation** – Unlock achievements for completed brews and learning milestones

- **Personal Brewing Assistant** - ChatBot helping out in tricky situations

### Future Improvements

- **Community Recipe Sharing** - Add friends and share your personal recipes

## Tech Stack

- **Frontend:** React Native + Nativewind

- **Backend:** SupaBase, Stripe

- **Database:** Supabase Postgres Database

- **Deployment:** Vercel

- **Analytics** Google Analytics (Firebase)
  - [Production environment](https://start-to-brew.vercel.app)

## How to run the project locally:

1. clone the repository

```
git clone https://github.com/Thomas-git-kul/StartToBrew.git
```

```
cd StartBrewing
```

In case the project has already been cloned, do:

```
git pull origin main
```

2. Install dependencies (only do this once)

```
npm install
```

```
npm install nativewind react-native-paper
```

```
npm install react-native-safe-area-context react-native-vector-icons
```

```
npm install tailwindcss
```

3. Start

```
npx expo start --tunnel Scan the QR code in the expo go app
```

or

```
npx expo start --web to see the localhost on the web
```

## How to contribute to the project

1. You create a branch for the functionality you want to add, The naming convention for branches is to name the branch after the functionality you are working on.

2. you need to have the env secrets which are in the env.example

3. When you're done implementing that funcitonality, you create a pull request to merge your branch with _dev_, this will then be reviewed by Thomas and pushed to dev.

> [!NOTE]
> Do not accept the merge request yourself!*\*\* > *Thomas has to accept the merge request as he is the only author who has rights to deploy to Vercel.\* > _Therefore, a git issue is made automatically to notify him of your pull request._

4. Check your pull request: linting, testing and vulnability scan should all be succesful.

5. In case of errors, you can do new pushes to your branch. You do not have to make a new pull request, your pull request will synchronize automatically.
