# NgOpenflowAuth

Holder project for the NgOpenflowAuth angular Component for easy authentication in custom Angular Projects.

1) Install NgOpenflowAuth angular-oauth2-oidc and @openiap/openflow-api

``` npm i @openiap/ng-openflow-aut angular-oauth2-oidc @openiap/openflow-api``` 

2) Add Configuration file for oauth2-oidc and NgOpenflowAuth 
Under src/app add a new file called authCodeFlowConfig.ts 

```javascript
import { AuthConfig } from 'angular-oauth2-oidc';
const domain:string = "app.openiap.io";
export const api_wsurl: string = "wss://" + domain;
export const authCodeFlowConfig: AuthConfig = {
    issuer: "https://" + domain + "/oidc",
    redirectUri: window.location.origin,
    responseType: 'code',
    clientId: 'myngapp',
    scope: 'openid profile email'
};
```

2) Tell angular to ignore the npm modules used by @openiap/openflow-api
Open package.json and add a browser section

```json
  "browser": {
    "fs": false,
    "path": false,
    "crypto": false
  },
```

3) Register angular-oauth2-oidc and HttpClientModule
open app.module.ts and add

```javascript
// Add imports
import { OAuthModule } from 'angular-oauth2-oidc';
import { api_wsurl, authCodeFlowConfig } from './authCodeFlowConfig';
import { HttpClientModule } from '@angular/common/http';
// Add to @NgModule
@NgModule({
	declarations: [],
	imports: [
        HttpClientModule,
		OAuthModule.forRoot()
	],
	providers: [
        {provide: 'apiwsurl', useValue: api_wsurl},
        {provide: 'authCodeFlowConfig', useValue: authCodeFlowConfig}
	],
	bootstrap: []
})


```

3) In any component you want to check if the user has been signed in, get data.
Add this to the component.ts file

```javascript
// Add imports
import { NgOpenflowAuthService } from '@openiap/ng-openflow-auth';

export class UsersComponent implements OnInit {
    // Add NgOpenflowAuthService as an injected service in the constructor
    constructor(
        public openflowAuthService: NgOpenflowAuthService
      ) { }

    // Create place holder for users
    public users: any[] = [];
    // Then in add a callback doing the sigin event, 
    ngOnInit(): void {
        this.openflowAuthService.onSignedin(async user=> {
            console.log("Signed in as " + user.name);
            try {
                // Get list of all users in openflow
                this.users = await NoderedUtil.Query("users", {"_type": "user"}, null, null, 100, 0, null as any);
            } catch (error) {
                console.error(error);
            }
        });
    }
}
```

And to allow the user to sign in/sing out and see the list add  this to the html page

```html
<button *ngIf="!openflowAuthService.isSignedIn" (click)="openflowAuthService.Login()">Login</button>
<button *ngIf="openflowAuthService.isSignedIn" (click)="openflowAuthService.Logout()">Logout</button>
<div *ngIf="openflowAuthService.isSignedIn">
    <h2>Users</h2>
    <li *ngFor="let item of users">
        <span class="badge">{{item._type}}</span>: {{item.name}}
    </li>
</div>
```

