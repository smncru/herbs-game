import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpParams } from '@angular/common/http';
import { exhaustMap, take } from 'rxjs/operators';
import { GameModeComponent } from '../hub/game-mode/game-mode.component';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor{
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return this.authService.user.pipe(
      take(1),
      exhaustMap(user => {
        if (!user) {
          return next.handle(req);
        }

        const authReq = req.clone(
          {
            params: new HttpParams().set('auth', user.token)
          }
        );
        return next.handle(authReq);
      })
    );
  }
}