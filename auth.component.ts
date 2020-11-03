import { Component, OnInit, ComponentFactoryResolver, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService, AuthResponseData } from './auth.service';
import { Observable, Subscription } from 'rxjs';
import {Router } from '@angular/router';
import { AlertComponent } from '../shared/alert/alert.component';
import { PlaceHolderDirective } from '../shared/place-holder.directive';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html'
})
export class AuthComponent implements OnInit, OnDestroy{

  constructor(private authService: AuthService, private router: Router,
              private componentFactoryResolver: ComponentFactoryResolver) { }

  isLoading = false;
  error: string = null;
  @ViewChild(PlaceHolderDirective, { static: true}) alertHost: PlaceHolderDirective;
  closeRef: Subscription;

  ngOnInit() {
  }
  isLoggedIn = true;

  onSwitchMode(){
    this.isLoggedIn = !this.isLoggedIn;
  }

  onSubmit(form: NgForm ){
    if(!form.valid)
    {
      return;
    }

    let authObs : Observable<AuthResponseData>;
    this.isLoading = true;

    if(this.isLoggedIn)
    {
      authObs = this.authService.logIn(form.value.email, form.value.password);
    }
    else{
      authObs = this.authService.signUp(form.value.email, form.value.password)
    }

    authObs.subscribe(
      data => {
        console.log(data);
        this.isLoading = false;
        this.router.navigate(['/recipes']);
      }, 
      errorMessage => {
        console.log(errorMessage);
        this.error = errorMessage;
        this.showError(errorMessage);
        this.isLoading = false;
      } 
    );
    form.reset();
    }

    onHandleError(){
      this.error = null;
    }

    ngOnDestroy(){
      if(this.closeRef){
        this.closeRef.unsubscribe();
      }
    }

    private showError(message: string){

      const alertCmpFactory = this.componentFactoryResolver.resolveComponentFactory(AlertComponent);
      const hostViewContainerRef = this.alertHost.viewContainerRef;
      hostViewContainerRef.clear();
      const componentRef = hostViewContainerRef.createComponent(alertCmpFactory);
      componentRef.instance.message = message;
      this.closeRef =  componentRef.instance.close.subscribe(() => {
        this.closeRef.unsubscribe();
        hostViewContainerRef.clear();
      });

    }
    
}
