import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterConfig, RouterModule } from '@angular/router';

import { NavigationComponent } from './navigation/navigation.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductsComponent, VariantList } from './products/products.component';
import { ProductDetailComponent } from './product-detail/product-detail.component'
import { OrdersComponent } from './orders/orders.component';

import { UserService } from './shared/user.service';
import { ControlsService } from './shared/controls.service';
import { LoggedInGuard } from './shared/logged-in.guard';
import { HerokuService } from './shared/heroku.service';
import { AuthProviders, AuthMethods, AngularFireModule } from 'angularfire2';
import { OrderDetailComponent } from './order-detail/order-detail.component';

const firebaseConfig = {
  apiKey: "AIzaSyCbzQTM1kMvD5EsdXSU-moUJFaXgHX0Kr8",
  authDomain: "dorrbell-test.firebaseapp.com",
  databaseURL: "https://dorrbell-test.firebaseio.com",
  storageBucket: "dorrbell-test.appspot.com",
}
const myFirebaseAuthConfig = {
  provider: AuthProviders.Password,
  method: AuthMethods.Password
}


const routes: RouterConfig = [
  {
    path : 'orders',
    component : OrdersComponent,
    canActivate : [LoggedInGuard]
  },
  {
    path : '',
    component : DashboardComponent,
    canActivate : [LoggedInGuard]
  },
  {
    path : 'products',
    component : ProductsComponent,
    canActivate : [LoggedInGuard]
  },
  {
    path : 'product/:id', component : ProductDetailComponent, canActivate : [LoggedInGuard]
  },
  {
    path : 'order/:id', component : OrderDetailComponent, canActivate : [LoggedInGuard]
  }
];

@NgModule({
  declarations: [
    NavigationComponent,
    DashboardComponent,
    OrdersComponent,
    ProductsComponent,
    ProductDetailComponent,
    VariantList,
    OrderDetailComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(firebaseConfig, myFirebaseAuthConfig),
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    HttpModule
  ],
  providers: [UserService, LoggedInGuard, ControlsService, HerokuService],
  bootstrap: [NavigationComponent]
})
export class AppModule { }
