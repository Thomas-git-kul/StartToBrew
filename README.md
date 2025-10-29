# StartToBrew

***A guided app that helps amateur brewers confidently craft their first beers.***

## Project description
StartToBrew is a SaaS app designed for beginner homebrewers who want to learn beer brewing in a structured, enjoyable, and stress-free way. It offers step-by-step guidance, timers, progress tracking, and motivational design principles to help users succeed in brewing their first batches.

### Features
- **Guided Brewing Experience** – Step-by-step instructions from boiling to bottling

- **Webshop** - Users can buy their first starter kit along with more materials/ingredients

- **Timers & Notifications** – Reminders for brewing and fermentation checkpoints

- **Brew Tracking Dashboard** – Log batches, track results, and review performance

- **Progress Motivation** – Unlock achievements for completed brews and learning milestones

- **Personal Brewing  Assistant** - ChatBot helping out in tricky situations

### Future Improvements
- **Community Recipe Sharing** - Add friends and share your personal recipes

## Tech Stack
- **Frontend:** React Native + TailwindCSS

- **Backend:** SupaBase

- **Database:**

- **Deployment:** Vercel
    - [Production environment](https://start-to-brew.vercel.app)

## How to run the project locally:
1. Clone the repository
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
npx expo start --tunnel
```

4. Scan the QR code in the expo go app

## How to contribute to the project
1. You create a branch for the functionality you want to add

2. When you're done implementing that funcitonality, you create a pull request to merge your branch with *dev*

> [!NOTE]
> Do not accept the merge request yourself!***
*Thomas has to accept the merge request as he is the only author who has rights to deploy to Vercel.*
*Therefore, a git issue is made automatically to notify him of your pull request.*

3. Check your pull request: linting, testing and vulnability scan should all be succesful.

4. In case of errors, you can do new pushes to your branch. You do not have to make a new pull request, your pull request will synchronize automatically.


