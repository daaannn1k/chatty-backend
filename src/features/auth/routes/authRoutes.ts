import express, { Router } from 'express';

import { SignUp } from '@auth/controllers/signup';
import { SignIn } from '@auth/controllers/singin';
import { Signout } from '@auth/controllers/signout';

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', SignUp.prototype.create);
    this.router.post('/signin', SignIn.prototype.read);

    return this.router;
  }

  public signoutRoute(): Router {
    this.router.get('/signout', Signout.prototype.update);

    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
