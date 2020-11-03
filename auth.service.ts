import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { User } from './user.model';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface AuthResponseData {
    kind: string;
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered: boolean;
}

@Injectable({providedIn: 'root'})
export class AuthService{

    user = new BehaviorSubject<User>(null);
    //.. Here we use Behavior subject, for which we dont need to subscribe to the current event.
    //...If we want to get details of the last emitted event i.e in this case it will be the active user
    //...then we use this. its behavior is same as Subject, only here we need to pass value.. in strating
    //...we dont want to pass any user so we pass null.

    constructor(private http: HttpClient, private router: Router) {}

    timerDuration: any;

    signUp(email:string, password: string){

        return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseKey,
        {
            email: email,
            password: password,
            returnSecureToken: true
        }).pipe(catchError(this.ErrorHandling),
        tap( errorRes => {
            this.AuthenticateUser(errorRes.email, errorRes.localId, errorRes.idToken, +errorRes.expiresIn);
        }
        ));
    }

    logIn(email:string, password: string){

        return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + environment.firebaseKey,
        {
            email: email,
            password: password,
            returnSecureToken: true
        }
        ).pipe(catchError(this.ErrorHandling),
        tap( errorRes => {
            this.AuthenticateUser(errorRes.email, errorRes.localId, errorRes.idToken, +errorRes.expiresIn);
        })
        );
    }

    logOut(){
        this.user.next(null);
        this.router.navigate(['/auth']);
        localStorage.removeItem('userData');
        if(this.timerDuration)
        {
            clearTimeout(this.timerDuration);
        }
        this.timerDuration = null;
    }

    autoLogin(){
        const userData: {
            email: string,
            id: string,
            _token: string,
            _tokenExpirationDate: string
        } = JSON.parse(localStorage.getItem('userData'));

        if(!userData){
            return;
        }
        const loadedUser = new User(
            userData.email, 
            userData.id, 
            userData._token, 
            new Date(userData._tokenExpirationDate));

        if(loadedUser.token)
        {
            this.user.next(loadedUser);
            const tokenDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(tokenDuration);
        }

    }

    autoLogout(expirationTime: number){
        this.timerDuration = setTimeout(() => {
            this.logOut();
        }, expirationTime);
    }

    private ErrorHandling(errorRes: HttpErrorResponse){
        let errorMessage = "An unknown error has occured";
                if(!errorRes.error || !errorRes.error.error){
                    return throwError(errorMessage);
                }
                
                switch(errorRes.error.error.message){
                    case 'EMAIL_EXISTS':
                        errorMessage = "Email Id already exists";
                        break;
                    case 'EMAIL_NOT_FOUND':
                        errorMessage = "Email Id does not exist!";
                        break;
                    case 'INVALID_PASSWORD':
                        errorMessage = "Password is incorrect!";
                        break;
                }
                return throwError(errorMessage);
    }

    private AuthenticateUser(email: string, userId: string, token: string, expiresIn: number){
        const expirationDate = new Date( new Date().getTime() + expiresIn * 1000);
        const user = new User(email, userId, token, expirationDate);
        this.user.next(user);
        this.autoLogout(expiresIn * 1000);
        localStorage.setItem('userData', JSON.stringify(user));
        
    }
}