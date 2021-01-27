import { IPaymentProvider } from '../interfaces/IPaymentProvider';
import Stripe from 'stripe';
import { isNil } from 'lodash';
import ConduitGrpcSdk from "@quintessential-sft/conduit-grpc-sdk";

export class StripeProvider implements IPaymentProvider {
  private readonly api_key: string;
  private client: Stripe;

  constructor(api_key: string, private readonly grpcSdk: ConduitGrpcSdk, private readonly database: any) {
    this.api_key = api_key;
    this.client = new Stripe(this.api_key, {
      apiVersion: "2020-08-27"
    });
  }

  async createPayment(
    productName: string,
    currency: string,
    unitAmount: number,
    userId?: string
  ): Promise<any> {

    const intent = await this.client.paymentIntents.create({
      amount: unitAmount,
      currency,
      metadata: {
        product: productName,
        userId: isNil(userId) ? null : userId
      }
    });

    await this.database.create('Transaction', {
      userId,
      provider: 'stripe',
      data: intent
    });

    return Promise.resolve({ clientSecret: intent.client_secret, paymentId: intent.id });
  }

  async cancelPayment(paymentId: string, userId?: string): Promise<boolean> {
    let errorMessage: string | null = null;
    const intent = await this.client.paymentIntents.cancel(paymentId)
      .catch((e: Error) => {
        errorMessage = e.message;
      });
    if (!isNil(errorMessage)) {
      return Promise.reject(errorMessage);
    }

    await this.database.create('Transaction', {
      userId,
      provider: 'stripe',
      data: intent
    });

    return Promise.resolve(true)
  }

  async refundPayment(paymentId: string, userId?: string): Promise<boolean> {
    let errorMessage: string | null = null;
    const intent = await this.client.refunds.create({
      payment_intent: paymentId,
      metadata: {
        userId: isNil(userId) ? null : userId
      }
    }).catch((e: Error) => {
      errorMessage = e.message;
    });
    if (!isNil(errorMessage)) {
      return Promise.reject(errorMessage);
    }

    await this.database.create('Transaction', {
      userId,
      provider: 'stripe',
      data: intent
    })

    return Promise.resolve(true);
  }
}