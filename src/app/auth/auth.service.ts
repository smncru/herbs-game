import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { User } from './user.model';

interface NameData {
  email: string,
  name: string
}

export interface AuthResponseData {
  idToken: string,
  email: string,
  refreshToken: string,
  expiresIn: string,
  localId: string,
  registered?: boolean
}

@Injectable()
export class AuthService {
  user = new BehaviorSubject<User>(null);

  // to store the timeout object
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient) {}

  signup(_email: string, _name: string, _password: string) {
    // this.http.put<NameData>(
    //   environment.db.names,
    //   {
    //     email: _email,
    //     name: _name
    //   }).subscribe();

    return this.http.post<AuthResponseData>(
      environment.endpoints.signup + environment.API_KEY,
      {
        email: _email,
        password: _password,
        returnSecureToken: true
      }
    ).pipe(
      catchError(this.handleError),
      tap(res => {
        this.handleAuthentication(res.localId, res.email, _name, res.idToken, +res.expiresIn);
      })
    );
  }

  login(_email: string, _password: string) {
    let _name = 'tempName';

    return this.http.post<AuthResponseData>(
      environment.endpoints.signin + environment.API_KEY,
      {
        email: _email,
        password: _password,
        returnSecureToken: true
      }
    ).pipe(
      catchError(this.handleError),
      tap(res => {
        this.handleAuthentication(res.localId, res.email, _name, res.idToken, +res.expiresIn);
      })
    );
  }

  logout() {
    this.user.next(null);
    localStorage.removeItem('userData');
    if(this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationTime: number) {
    this.tokenExpirationTimer = setTimeout(
      () => this.logout(),
      expirationTime);
  }

  private handleAuthentication(uid: string, email: string, name: string, token: string, expiresIn: number) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(uid, email, name, token, expirationDate);
    this.user.next(user);
    this.autoLogout(expiresIn * 1000);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(err: HttpErrorResponse) {
    // TODO: log the error object on the server
    let errMessage = 'A mysterious error occurred! Try again and please remind the developer to implement a better error handling system. Thanks.';

    if(!err.error || !err.error.error) {
      return throwError(errMessage);
    }

    switch (err.error.error.message) {
      case 'EMAIL_EXISTS':
        errMessage = 'This e-mail address has already been taken!';
        break;
      case 'EMAIL_NOT_FOUND':
        errMessage = 'E-mail address not found!';
        break;
      case 'INVALID_PASSWORD':
        errMessage = "Incorrect password!";
        break;
      case 'OPERATION_NOT_ALLOWED':
        errMessage = "Password sign-in is disabled for this project.";
        break;
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        errMessage = "We have blocked all requests from this device due to unusual activity. Try again later.";
        break;
      case 'USER_DISABLED':
        errMessage = "The user account has been disabled by an administrator.";
        break;
    }

    return throwError(errMessage);
  }

}
