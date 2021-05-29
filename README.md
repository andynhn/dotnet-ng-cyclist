# Documentation: Meet Cyclists

## Summary
Meet Cyclists is a social connection and live chatting app built using C#/.NET Core and Angular with a PostgreSQL database.

This application is based on the dating app built alongside Udemy's online course on how to build a web app using ASP.NET Core and Angular. It incorporates many of the same designs, components, and core features as the Udemy course, but I took the theme and styling in a different direction and implemented a few additional features using what I had learned. These additional features include:

1. A separate consolidated chat page (e.g. Facebook Messenger, Apple Messages, etc.) with infinite scrolling (API call to load messages when the user scrolls to the top of the current chat box) and dynamic name filtering when searching for message threads by username (by using a custom Angular pipe).
2. Changing passwords and deleting accounts using ASP.NET Identity.
3. Additional filtering and search criteria for the "Discover" page related to the cycling theme. For example, I added options for preferred cycling surface, cycling frequency, and skill level. I also added a State/City search using a JSON file. When searching for users, the City field will dynamically update based on what the user selects for the State.
4. Responsive styling using ngx-bootstrap, including the use of side navigation for pages that include search and filters. This gave those pages a bit of a cleaner dashboard design.


GitHub: *[https://github.com/andynhn/dotnet-ng-cyclist](https://github.com/andynhn/dotnet-ng-cyclist)*

This document will guide developers on how to set up the application on their local machine. It will also provide a general overview of the application's overall architecture.

After reviewing this guide, new developers should be able to set up a functioning developer environment and have a better understanding of how to read and access key application files while working on the app. It does not provide an exhaustive overview, but it is a good place for developers to get started.
+++
# Table of Contents
## 1. Getting Started
	1.1 Set up the developer environment
		1.1.1 Install .NET Core 5.0
		1.1.2 Install Node.js
		1.1.3 Install the Angular CLI
		1.1.4 Install Docker Hub and Start a PostgreSQL Instance
	1.2 Clone the Project from GitHub
	1.3 Install the Application Dependencies
		1.3.1 Restore the .NET API Dependencies
		1.3.2 Install the Angular Dependencies
	1.4 Run the Application
		1.4.1 Ensure that the PostgreSQL instance is running
		1.4.2 Start the API
		1.4.3 Start the Angular App
		1.4.4 Troubleshooting
## 2. Understanding the .NET API Project Architecture
	2.1 API Structure
## 3. Understanding the Angular Project Architecture
	3.1 Angular App Structure
		3.1.1 ./client/src/app
		3.1.2 ./client/src/assets
		3.1.3 ./client/src/environments

+++
# 1. Getting Started

## 1.1 Set up the developer environment
### 1.1.1 Install .NET Core 5.0
This application uses .NET Core 5.0 for the API project.
- Head to [https://dotnet.microsoft.com/download/dotnet-core](https://dotnet.microsoft.com/download/dotnet-core) to install the latest version of .NET 5.0.
- Keep a note of what version of .NET Core you installed on your machine. You should use this version number when downloading Microsoft-specific NuGet packages for the application.

### 1.1.2 Install Node.js
This application uses Angular/TypeScript for the client-side project. To install Angular, you must first install Node.js.

Node.js is a JavaScript runtime environment that compiles the TypeScript from Angular into JavaScript that the browser can read. It also includes a node package manager (npm) for installing packages that Angular applications need to work properly.
- Head to [https://nodejs.org/](https://nodejs.org/) to download the latest LTS version of node.

After installation, you can verify that Node and the package manager have been installed correctly by running `node -v` and `npm -v` in a terminal window.

### 1.1.3 Install the Angular CLI
Once you've installed Node and the npm client, you can use npm to install the Angular CLI. The CLI can be used to create Angular components and perform a variety of development tasks.

`npm install -g @angular/cli`

After installation, you can verify that the Angular CLI was installed correctly by running `ng --version` in your terminal window.

*For more information on installing Angular, please visit [https://angular.io](https://angular.io).* 

### 1.1.4 Install Docker Hub and Start a PostgreSQL Instance
This application uses a PostgreSQL database. For the development environment, you can use Docker Hub to start a postgres instance on your local machine.

- Download Docker hub from [https://hub.docker.com/_/postgres](https://hub.docker.com/_/postgres)

After you install Docker Hub, you can start a postgres instance by running:

`docker run --name dev -e POSTGRESS_USER=appuser -e POSTGRES_PASSWORD=Pa$$w0rd -p 5432:5432 -d postgres:latest`

There should now be a running instance listed within  your Docker Hub dashboard. If you are encountering issues, please refer to [https://hub.docker.com/_/postgres](https://hub.docker.com/_/postgres).

*TODO: provide information on pgAdmin 4*

## 1.2 Clone the Project from GitHub
Using your terminal, navigate to a directory on your local machine where you want to store the project files for the application. 

Use Git or checkout with SVN using the following web URL:

[https://github.com/andynhn/dotnet-ng-cyclist.git](https://github.com/andynhn/dotnet-ng-cyclist.git)

Once completed, navigate into the primary project directory. There should be two project folders, the **API** project and the **client** project.

## 1.3 Install the Application Dependencies
Both the API project and Angular client-side project rely on package dependencies that need to be installed when setting up the application for the first time. 

The API project uses NuGet packages and the Angular app uses node packages.

### 1.3.1 Restore the .NET API Dependencies
#### ./API/API.csproj
The *API.csproj* file within the API project contains a list of NuGet package dependencies that are used throughout the application. When setting up the project for the first time, these dependencies must be restored.

Navigate to the *./API/* directory within your terminal window and run the following to restore all dependencies: 

`dotnet restore` 

### 1.3.2 Install the Angular Dependencies
#### ./client/package.json
The *package.json* file contains all dependencies for the  Angular application. When setting up the project for the first time, these dependencies must be installed using npm.

Navigate to the *./client/* directory where *package.json* is located and run:

`npm install`

This will install all dependencies into a *./client/node_modules* folder.

## 1.4 Run the Application
After you've installed all dependencies, you can run the application.

### 1.4.1 Ensure that the PostgreSQL instance is running
The postgres instance in Docker needs to be running in order for the application to connect properly to the database. 

Open Docker Hub and ensure that the postgres instance is running.

### 1.4.2 Start the API
Navigate to *./API/* in your terminal and run:

`dotnet watch run`

This will build and run the dotnet project and automatically watch for any updates to the app that are saved. If it detects any new changes, it will re-run the app. 

If you do not want this auto-watch feature, simply run:

`dotnet run`

### 1.4.3 Start the Angular App
Navigate to *./client/* directory in your terminal and run:

`ng serve`

This will run the Angular project by building the app and serving it locally. It also detects changes to the source file and will automatically rebuild the app and reload the page.

### 1.4.4 Troubleshooting
If you encounter problems associated with the HTTPS certificate, navigate to the API project and run the following:

`dotnet dev-certs https --trust`

*TODO: provide instruction on how to install an SSL dev certificate within an Angular SSL folder*

+++

# 2. Understanding the .NET API Project Architecture
This section provides a brief overview of the .NET API project architecture. Review this section while referencing the project files to get a better understanding of where to access key files.

## 2.1 API Structure
The API project is organized into 13 primary directories, each providing important server-side functionality.
1. Controllers
	- This is the primary directory containing controller classes that handle incoming HTTP requests.
	- Related HTTP requests are organized into unique controller classes, based on functionality. 
		- For example, the *AccountController.cs* class is responsible for HTTP requests that handle account creation and deletion. The *AdminController.cs* class contains HTTP requests for admin-specific tasks.
	- Currently, the application uses a *BaseApiController.cs* class that inherits from *ControllerBase* and contains various other properties that are universal to the other controllers. The other controller classes inherit from the *BaseApiController*, which allows for more scalable and maintainable code.
2. Data
	- The application uses Entity Framework Core, an object-database mapper that supports LINQ queries, change tracking, updates, and migrations. To learn more about Entity Framework Core, visit: [https://docs.microsoft.com/en-us/aspnet/entity-framework](https://docs.microsoft.com/en-us/aspnet/entity-framework).
	- The Data directory contains a primary *DataContext.cs* file that provides the source code for contextualizing the Database via Entity Framework Core.
	- Repository classes are also stored here. These classes interact with the database via Entity Framework Core.
	- It also contains a Migrations directory that tells Entity Framework how to structure the database.
3. DTOs
	- The application uses Data Transfer Objects (DTOs) to facilitate and validate information being sent from the client to the server, and the DTO directory contains these classes.
	- For example, when registering a new user, it can be helpful to receive the user data as a DTO (e.g. RegisterDto.cs) that contains the username and password. You can perform validations on these properties within the Controller, modify the data if necessary, and then map the data to the *AppUser.cs* entity for saving within the Database.
4. Entities
	- The Entities directory contains all entity classes for the application. For example, our application allows users to create a user account, upload photos, and send messages to other users. To account for these features, the Entities folder contains classes for AppUsers, Messages, and Photos that provide important properties for each entity. 
	- The Data directory interacts with these Entity classes via *./API/Data/DataContext.cs* which instructs Entity Framework Core on how to structure the database. 
		- For example, if you add or remove an Entity, you need to make the appropriate changes with *./API/Data/DataContext.cs* and then run the appropriate migrations command that tells Entity Framework how to restructure the database.
5. Errors
	- The Errors folder contains the *ApiException.cs* class that the application uses for custom API exceptions. ApiExceptions are sent with a status code, message, and additional details.
	- Error-handling itself is implemented via the *ExceptionMiddleware.cs* class (See Middleware below).
6. Extensions
	- The Extensions folder contains numerous files that "extend the functionality" of a different class. 
	- The source files stored here can just as easily be written within the class that calls the function, but it can be helpful to organize and maintain these "extension methods" within this specific directory.
7. Helpers
	- The files within the Helpers directory contain methods that are commonly used across multiple classes. 
	- These methods assist class-specific methods with their functionality, and it is can be useful to store these in this separate directory.
8. Interfaces
	- The Interfaces folder contains all interface definitions. 
	- Interfaces define contracts, and any class that "implements an interface" must satisfy the contract by implementing the methods defined in the interface.
	- For more on interfaces in C#, see Microsoft's documentation: [https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/interface](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/interface)
9. Middleware
	- The Middleware folder contains classes that assist in handling requests and responses from within the application pipeline. For more on middleware within ASP.NET Core, see Microsoft's documentation: [https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-5.0](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-5.0)
	- For example, the primary custom middleware for this application resides within *./API/Middleware/ExceptionMiddleware.cs*, which is set up and accessed with the startup class, *Startup.cs*. This piece of middleware will monitor HTTP requests in the application pipeline and will respond to the client-side app with an HTTP error code response if it encounters an exception.
10. Properties
	- The Properties directory contains the *launchSettings.json* file. This file lets us customize launch settings in the application, including environment variables and application URLs.
11. Services
	- Unique application services are stored here with the Services directory. For example, the application uses JSON Web Tokens (JWT) to authenticate users, so a specific *TokenService.cs* class within the Services folder is responsible for generating JWTs.
	- The application also uses a third-party photo hosting service called *Cloudinary*, so there is a specific *PhotoService.cs* file that is responsible for adding and deleting photos from *Cloudinary*.
12. SignalR
	- The application uses SignalR to provide web socket functionality for live messaging and for indicating online presence in real-time. For more on SignalR, see Microsoft's official documentation: [https://docs.microsoft.com/en-us/aspnet/core/signalr/introduction?view=aspnetcore-5.0](https://docs.microsoft.com/en-us/aspnet/core/signalr/introduction?view=aspnetcore-5.0)
	- Currently, the primary files within the SignalR folder are "hubs" that are responsible for initiating the web socket connections for live chat and online presence.
	- Under the current architecture, any functionality that requires "real-time" updates using SignalR should reside here.
13. wwwroot
	- The wwwroot folder is the web root folder. In our application, it houses all static files, which can be accessed via the relative path to that root. 
	- Because the client-side app is Angular/TypeScript, which gets converted into a batch of JavaScript files during runtime, the Angular static files for production are stored here after a successful build. The API project in production will directly serve these files to the client.  

+++

# 3. Understanding the Angular Project Architecture
This section provides a brief overview of the Angular client-side project architecture.

## 3.1 Angular App Structure
Angular uses a single-page application that provides direct access to HTML, CSS, and JavaScript files from a central root folder. Unlike multi-page applications, where every page load needs to interact with the server via an HTTP request, Angular can quickly load front-end components without fetching these pages from the server. For more on Angular and its benefits, visit [https://angular.io/](https://angular.io/).

Our Angular app contains a primary *./client/src/* folder that contains all of the application's source files.

### 3.1.1 ./client/src/app
The *./client/src/app* folder contains all of the components, services, directives, guards, interceptors, models, modules, pipes, and resolvers for the application. 

Angular components are organized within their own folder after they are created with the Angular CLI:

`ng generate component NAME-OF-COMPONENT`

To differentiate Angular components from other Angular features, all other folders are prefixed with an underscore (e.g. _services, _directives). This assists with readability and navigation. 

For more information on Angular components, services, and features, visit [https://angular/io](https://angular/io).

### 3.1.2 ./client/src/assets
The *./client/src/assets* folder contains static files for the application that can be accessed via their relative path from the root directory. For example, our application uses this folder to store static images, icons, JSON files, and any other file type that an Angular component may need to directly access.

### 3.1.3 ./client/src/environments
The *./client/src/environments* folder contains *environment.ts* and *environment.prod.ts* files that we use to specify important environment variables.

For example, we can use these files to differentiate between a development and production API URL:

- API URL in development: https://localhost:5001/api/
- API URL in production: api/
