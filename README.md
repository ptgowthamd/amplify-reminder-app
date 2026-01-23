# amplify-reminder-app
Amplify fullstack application for reminder app

# Steps:
1. Create an github repository with ReadMe.md file
2. Clone the project to local
3. Run "amplify init" to create a new Amplify project (with given project-name) in AWS Cloud with dev envioronment by default. This doesn't create frontend scaffold.
4. Create vite (React project, no need to delete existed /src and files in it)
"npm create vite@latest . -- --template react"
Current directory is not empty. Please choose how to proceed:
│  Ignore files and continue (choose this option)
And starts at 5173 port in local.
5. Check in browser at "http://localhost:5173".
6. Push changes to git on new branch (development) and main
7. Connect the development branch with dev backend environment (create a new service role with AdministratorAccess-Amplify policy)
Now we can see logs for CI & CD pipeline for "development" branch.
8. After deployment the changes, you can access app https://development.dmiq26r8zc2c1.amplifyapp.com/
9. Go to Dev backend enviornment and click on "Enable Amplify Studio"
Which takes to "App settings: Amplify Studio settings" 
click on "dev" environment URL.
10. Click on login with AWS credentials to enter into Amplify Studio for "dev" env.
11. Create Data Model for "Reminder" and click on "deploy changes". Which creates AppSync GraphQL API with backend DynamoDB table.
12. Get latest client configuration files for GraphQL API:
Run the following command in Terminal from your project’s root folder
amplify pull --appId dmiq26r8zc2c1 --envName dev
13. Note: make sure installed latest version of Amplify CLI
using command: npm install -g @aws-amplify/cli
14. Change project-config.json like below, if It's default forms created are not fetched by "amplify pull"

      "framework": "react",


      "BuildCommand": "npm run build",
      "StartCommand": "npm run dev"
15. "amplify codegen models"
16. "npm install aws-amplify @aws-amplify/ui-react"
"npm install @aws-amplify/datastore"
17. run the frontend app in local by running command "npm run dev".
18. amplify update api
Choose GraphQL API
Enable Conflict detection → Auto Merge (or Optimistic Concurrency)
Push and regenerate:
19. amplify push
amplify codegen models
amplify pull --appId dmiq26r8zc2c1 --envName dev
20. Use ThemeProvider (from @aws-amplify/ui-react) get exact look in AmplifyStudio form or other UI components.
21. Make necessary CSS changes to looks good.
22. Eventhough these forms are working fine, success and failed responses are not showing. That logic should be added.
23. If you want to make any model changes from Amplify studio, after done pull the changes using command "amplify pull --appId dmiq26r8zc2c1 --envName dev" for dev env.
For createdAt and updatedAt attributes in model are managed automatically.
24. 

https://www.figma.com/community/file/1047600760128127424

Click on "Open in Figma"

Click on "Duplicate"

"Primitives"

"My Components" -> You can also edit to create new components

Click on "Sync with Figma" -> Paste the link of Figma file -> Click on continue ->
click on "allow access" 
Click on "Accept All Changes"
Click on "Accept All"

Select the required component from total component -> Click on "Configure"

If you want to create collection of componets, click on "Create Collection"

In collection settings, select direction, filters, sort conditions, search, pagination etc.,

After make any changes in Figma designs, to affect those changes into react components, click on "Sync with Figma" button, accept changes, next configure as required and pull the changes into project code base.
25. Add Coginito userpools for Auth and related steps in separate doc.
26. Update graphql api to change auth type to cognito-userpool if it's using API-key as default auth type.

27. Go to Amplify Studio Settings, click on login url for required environment and login with AWS SSO.

28. By default conflict detection/DataStore sync is enabled. If we don't want we can disable for GraphQL API. And make sure DataStore is not used anywhere.
To disable "conflict detection" on the API : amplify update api -> conflict detection off and "amplify push".

29. Auth mismatch: if the API is Cognito‑only, Studio can’t introspect models. Add AWS_IAM or API_KEY as an additional auth mode via amplify update api, then refresh Studio.
In my case, added AWS_IAM as additional auth-type. API_KEY additional auth-type also required.


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
