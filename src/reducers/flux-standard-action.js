export type FluxStandardAction<ActionType: string, Payload: any, Meta: any> = {
  error?: boolean,
  meta: Meta,
  payload: Payload,
  type: ActionType
};
