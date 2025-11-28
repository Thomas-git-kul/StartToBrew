// Stripe/index.tsx
import React, { ReactNode, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

// Define types
interface StripeWrapperProps {
  children: ReactNode;
}

// Web implementation
const WebStripeWrapper = ({ children }: StripeWrapperProps) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [Elements, setElements] = useState<any>(null);

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS === 'web') {
      const loadStripeJs = async () => {
        try {
          // Dynamically import web Stripe libraries
          const { loadStripe } = await import('@stripe/stripe-js');
          const { Elements: ElementsComponent } = await import('@stripe/react-stripe-js');
          
          // Initialize Stripe
          const stripePromiseInstance = loadStripe(publishableKey);
          setStripePromise(stripePromiseInstance);
          setElements(() => ElementsComponent);
          setStripeLoaded(true);
        } catch (error) {
          console.error('Failed to load Stripe.js:', error);
        }
      };

      loadStripeJs();
    }
  }, []);

  // If Stripe is loaded on web, wrap children in Elements provider
  if (Platform.OS === 'web' && stripeLoaded && Elements && stripePromise) {
    // Set up options for Elements
    const options = {
      // Add appearance options for consistency with your design
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#000',
          colorText: '#000',
          borderRadius: '8px',
        },
      },
      // Add client secret if you want to enable instant payment methods
      // clientSecret: 'your_client_secret'
    };
    
    return (
      <Elements stripe={stripePromise} options={options}>
        {children}
      </Elements>
    );
  }

  // Fallback or while loading
  return <>{children}</>;
};

// Mock createPaymentIntent for web
const webCreatePaymentIntent = async (amount: number, currency: string = "eur") => {
  const url = "https://neeqemudecnuayqlvohk.supabase.co/functions/v1/create-payment-intent";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ amount, currency }),
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Failed to create payment intent");

  return data; // { clientSecret: "pi_..." }
};


// Native implementation
const NativeStripeWrapper = ({ children }: StripeWrapperProps) => {
  if (Platform.OS !== 'web') {
    // Use an indirect reference that the bundler won't process at build time
    // The evaluation of this happens at runtime only
    const StripeProviderModule = global.require && global.require('@stripe/stripe-react-native');
    const StripeProvider = StripeProviderModule?.StripeProvider;
    
    if (StripeProvider) {
      return (
        <StripeProvider
          publishableKey={publishableKey}
          merchantIdentifier="merchant.com.yourdomain.app"
        >
          {children}
        </StripeProvider>
      );
    }
  }
  
  // Fallback if native module can't be loaded
  return <>{children}</>;
};

// Native implementation of createPaymentIntent
const nativeCreatePaymentIntent = async (amount: number, currency: string = 'eur') => {
  if (Platform.OS !== 'web') {
    console.log(`[NATIVE] Creating payment intent for ${amount} ${currency}`);
    return { clientSecret: 'mock_client_secret_for_native_testing' };
  }
  return webCreatePaymentIntent(amount, currency);
};

// Export platform-specific implementations
export const StripeWrapper = Platform.OS === 'web' ? WebStripeWrapper : NativeStripeWrapper;
export const createPaymentIntent = Platform.OS === 'web' ? webCreatePaymentIntent : nativeCreatePaymentIntent;