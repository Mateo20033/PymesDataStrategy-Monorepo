export type IRNode =
  | { op: 'FILL_LITERAL'; value: string | number | null }
  | { op: 'FILL_AGGREGATE'; agg: AggregateFunction }
  | { op: 'FILL_FROM_COLUMN'; sourceColumn: string }
  | { op: 'DELETE_ROWS' }
  | { op: 'KEEP' }
  | { op: 'TRANSFORM'; fn: TransformFn; params?: Record<string, unknown>; input: IRNode }
  | { op: 'CONDITIONAL'; condition: Condition; then: IRNode; else: IRNode };

export type AggregateFunction = 'mean' | 'median' | 'mode' | 'min' | 'max' | 'sum';

export type TransformFn =
  | 'round' | 'floor' | 'ceil' | 'abs'
  | 'upper' | 'lower' | 'title' | 'trim'
  | 'multiply' | 'add' | 'subtract' | 'divide';

export interface Condition {
  op: ConditionOp;
  left: Operand;
  right?: Operand;
  upper?: Operand;
}

export type ConditionOp =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'is_null' | 'is_not_null'
  | 'contains' | 'starts_with' | 'ends_with' | 'between';

export type Operand =
  | { kind: 'column'; column: string }
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'aggregate'; agg: AggregateFunction; column: string };

export interface IRCorrection {
  ir: IRNode;
  irSource: 'rule' | 'gemini';
  irRawText: string;
}

export interface PreviewResult {
  ir: IRNode;
  source: 'rule' | 'gemini';
  preview: {
    description: string;
    affectedRows: number;
    sampleResult: string | number | null;
    requiresConfirmation: boolean;
  };
}

export interface PreviewError {
  error: 'gemini_unavailable' | 'invalid_instruction';
  message: string;
  canRetry: boolean;
}
