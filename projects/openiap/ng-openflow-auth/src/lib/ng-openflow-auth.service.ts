import { Inject, Injectable } from '@angular/core';
import { NoderedUtil, TokenUser, WebSocketClient } from '@openiap/openflow-api';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NgOpenflowAuthService {
  // ng build @openiap/ng-openflow-auth --prod
  // npm publish .\dist\openiap\ng-openflow-auth\
  // npm i @openiap/ng-openflow-auth
  // npm i C:\code\ng-openflow-auth\dist\openiap\ng-openflow-auth
  // https://www.leonelngande.com/how-i-inject-pass-additional-parameters-into-angular-services/
  // https://jasonwatmore.com/post/2020/06/16/angular-npm-how-to-publish-an-angular-component-to-npm
  constructor(
    public oauthService: OAuthService,
    @Inject('apiwsurl') public apiwsurl: string,
    @Inject('authCodeFlowConfig') public authCodeFlowConfig: AuthConfig
  ) {
    this.ConfigureImplicitFlowAuthentication();
  }
  public agent: string = "customwebapp";
  public version: string = "0.0.6";
  public logger: any = {
    info(msg: any) { console.log(msg); },
    verbose(msg: any) { console.debug(msg); },
    error(msg: any) { console.error(msg); },
    debug(msg: any) { console.debug(msg); },
    silly(msg: any) { console.debug(msg); }
  }
  private SignedInSource = new Subject<TokenUser>();
  signedIn$ = this.SignedInSource.asObservable();
  private InitializedSource = new Subject<boolean>();
  Initialized$ = this.InitializedSource.asObservable();
  public IsInitialized: boolean = false;
  Title = "My title"
  SetTitle(Title: string) {
    this.Title = Title;
  }

  public Login() {
    this.ConfigureImplicitFlowAuthentication(true);
  }
  public isSignedIn: boolean = false;
  public hasToken: boolean = false;
  public hasValidToken: boolean = false;
  public Logout() {
    this.hasToken = false;
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
      const idt = this.oauthService.getIdToken();
      if (NoderedUtil.IsNullEmpty(id)) return;
      console.log("Sign in with access token " + id + " or id token " + idt)
      const result = await NoderedUtil.SigninWithToken({ rawAssertion: id });
      this.user = TokenUser.assign(result.user);
      this.isSignedIn = true;
      this.SignedInSource.next(this.user);
    } catch (error) {
      console.error(error);
    }
  }
  public UserProfile: any;
  public WebSocketClient() {
    return WebSocketClient.instance;
  }
  public ConfigureImplicitFlowAuthentication(dologin: boolean = false) {
    try {
      // this.oauthService.events.subscribe(e => console.log(e));
      this.oauthService.configure(this.authCodeFlowConfig);
      // this.oauthService.tokenValidationHandler = new JwksValidationHandler();
      this.oauthService.loadDiscoveryDocument().then((doc: any) => {
        this.oauthService.tryLogin().catch((err: any) => {
          this.IsInitialized = true;
          console.error(err);
        }).then(() => {
          if (!this.oauthService.hasValidAccessToken() && dologin == true) {
            this.oauthService.initImplicitFlow();
          } else if (this.oauthService.hasValidAccessToken()) {
            this.hasToken = true;
            this.oauthService.loadUserProfile().then((userprofile: any) => {
              console.debug("userprofile", userprofile);
              var t1 = WebSocketClient;
              var t2 = NoderedUtil;
              this.hasValidToken = true;
              this.UserProfile = userprofile;
              if (WebSocketClient.instance == null) {
                const cli: WebSocketClient = new WebSocketClient(this.logger, this.apiwsurl);
                cli.agent = this.agent;
                cli.version = this.version;
                cli.events.on('connect', () => {
                  this.logger.info('connected to ' + this.apiwsurl);
                  // this.loadToken();
                  if (this.UserProfile) {
                    this.loadToken();
                  }
                });
                cli.connect();
              }
              this.InitializedSource.next(true);
              this.IsInitialized = true;
            }).catch((err: any) => {
              this.InitializedSource.next(true);
              this.IsInitialized = true;
              console.debug(err);
            });
          } else {
            this.InitializedSource.next(true);
            this.IsInitialized = true;
          }
        });
      });
    } catch (error) {
      console.error(error)
    }
  }

  public async asyncCanLogin(): Promise<boolean> {
    try {
      this.oauthService.configure(this.authCodeFlowConfig);
      var doc = await this.oauthService.loadDiscoveryDocument();
      await this.oauthService.tryLogin();
      if (this.oauthService.hasValidAccessToken()) {
        return true;
      }
    } catch (error) {
      console.error(error)
    }
    return false;
  }
}
export declare type onSignedinCallback = (user: TokenUser) => void;