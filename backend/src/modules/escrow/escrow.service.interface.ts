export type EscrowSource = 'renter_cash' | 'credit_line';
export type EscrowStatus = 'locked' | 'pending_return' | 'released' | 'compensated';

export interface EscrowResult {
  escrowId: string;
  orderId: string;
  amount: number;
  source: EscrowSource;
  status: EscrowStatus;
}

export interface IEscrowService {
  lock(orderId: string): Promise<EscrowResult>;
  release(orderId: string): Promise<EscrowResult>;
  compensate(orderId: string, deductAmount: number): Promise<EscrowResult>;
}
