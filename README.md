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
6. Push changes to git on new branch



# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
