export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  public request: {
    auth?: {
      uid: string,
      token: { [key: string]: any },
    };
    method: SecurityRuleContext['operation'];
    path: string;
    resource?: {
      data: any;
    };
  };

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This mirrors the structure shown in the Firebase Console for rule debugging
    this.request = {
      method: context.operation,
      path: `/databases/(default)/documents/${context.path}`,
    };
    if (context.requestResourceData) {
      this.request.resource = { data: context.requestResourceData };
    }
  }

  public setAuthContext(auth: { uid: string, token: { [key: string]: any } } | null) {
    if (auth) {
      this.request.auth = auth;
    }
  }
}
