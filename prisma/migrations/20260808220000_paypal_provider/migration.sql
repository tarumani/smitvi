-- Add PayPal as a subscription / payment provider
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'PAYPAL';
