import { Inject, Injectable } from '@angular/core';
import { NoderedUtil, TokenUser, WebSocketClient } from '@openiap/openflow-api';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { Subject } from 'rxjs';

@Injectable({providedIn: 'root'})
export class NgOpenflowAuthService {
  // ng build @openiap/ng-openflow-auth --prod
  // npm publish .\dist\openiap\ng-openflow-auth\
  // npm i @openiap/ng-openflow-auth
  // https://www.leonelngande.com/how-i-inject-pass-additional-parameters-into-angular-services/
  // https://jasonwatmore.com/post/2020/06/16/angular-npm-how-to-publish-an-angular-component-to-npm
  constructor(
    private oauthService: OAuthService,
    @Inject('apiwsurl') private apiwsurl: string,
    @Inject('authCodeFlowConfig') private authCodeFlowConfig: AuthConfig
  ) {
    this.ConfigureImplicitFlowAuthentication();
  }
  private logger: any = {
    info(msg: any) { console.log(msg); },
    verbose(msg: any) { console.debug(msg); },
    error(msg: any) { console.error(msg); },
    debug(msg: any) { console.debug(msg); },
    silly(msg: any) { console.debug(msg); }
  }

  private SignedInSource = new Subject<TokenUser>();
  signedIn$ = this.SignedInSource.asObservable();
  Title = "My title"
  SetTitle(Title: string) {
    this.Title = Title;
  }

  public Login() {
    this.ConfigureImplicitFlowAuthentication(true);
  }
  public isSignedIn: boolean = false;
  public Logout() {
    this.isSignedIn = false;
    this.UserProfile = null;
    this.user = undefined as any;
    this.oauthService.revokeTokenAndLogout();
  }
  onSignedin(callback: onSignedinCallback) {
    if (this.isSignedIn) {
      callback(this.user);
      return;
    }
    const subscription = this.signedIn$.subscribe(user => {
      subscription.unsubscribe();
      try {
        callback(user);
      } catch (error) {
        console.error(error);
      }
    });
  }
  getIdToken() {
    var t = this.oauthService.getIdToken();
    this.oauthService.getAccessToken();
    return t;
  }
  getAccessToken() {
    var t = this.oauthService.getAccessToken();
    return t;
  }
  public user: TokenUser = undefined as any;
  public async loadToken(): Promise<void> {
    try {
      const id = this.oauthService.getAccessToken();
      if (NoderedUtil.IsNullEmpty(id)) return;
      console.log("Sign in with " + id)
      const result = await NoderedUtil.SigninWithToken("", id, "");
      this.user = result.user;
      this.isSignedIn = true;
      this.SignedInSource.next(this.user);
    } catch (error) {
      console.error(error);
    }
  }
  public UserProfile: any;
  private ConfigureImplicitFlowAuthentication(dologin: boolean = false) {
    try {
      // this.oauthService.events.subscribe(e => console.log(e));
      this.oauthService.configure(this.authCodeFlowConfig);
      // this.oauthService.tokenValidationHandler = new JwksValidationHandler();
      this.oauthService.loadDiscoveryDocument().then((doc: any) => {
        this.oauthService.tryLogin().catch((err: any) => {
          console.error(err);
        }).then(() => {
          if (!this.oauthService.hasValidAccessToken() && dologin == true) {
            this.oauthService.initImplicitFlow()
          } else if (this.oauthService.hasValidAccessToken()) {
            this.oauthService.loadUserProfile().then((userprofile: any) => {
              this.UserProfile = userprofile;
              if (WebSocketClient.instance == null) {
                const cli: WebSocketClient = new WebSocketClient(this.logger, this.apiwsurl);
                cli.agent = "customwebapp";
                cli.version = "0.0.3";
                cli.events.on('connect', () => {
                  this.logger.info('connected to ' + this.apiwsurl);
                  // this.loadToken();
                  if (this.UserProfile) {
                    this.loadToken();
                  }
                });
                cli.connect();
              }

            }).catch((err: any) => console.error(err));

          }
        });
      });
    } catch (error) {
      console.error(error)
    }
  }
}
export declare type onSignedinCallback = (user: TokenUser) => void;