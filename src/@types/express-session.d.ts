import 'express-session';
import { Request } from 'express';

// Extend express-session SessionData to include your custom field
declare module 'express-session' {
  interface SessionData {
    user_id?: number; // Add `user_id` to session data
  }
}

// Extend the Express Request type to include the session property
declare module 'express-serve-static-core' {
  interface Request {
    session: Session & Partial<SessionData>;
  }
}
