import { Builder } from '@builder.io/react';

// Initialize Builder.io with your public API key
// Replace 'YOUR_BUILDER_PUBLIC_API_KEY' with your actual Builder.io public API key
Builder.init('YOUR_BUILDER_PUBLIC_API_KEY');

// Register custom components that Builder.io can use
Builder.registerComponent('Button', {
  inputs: [
    { name: 'text', type: 'string', defaultValue: 'Click me' },
    { name: 'variant', type: 'string', enum: ['default', 'outline', 'secondary'], defaultValue: 'default' },
    { name: 'size', type: 'string', enum: ['sm', 'md', 'lg'], defaultValue: 'md' },
    { name: 'onClick', type: 'string', helperText: 'Function to run when clicked' }
  ]
});

Builder.registerComponent('Card', {
  inputs: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'image', type: 'file', allowedFileTypes: ['jpeg', 'jpg', 'png', 'svg'] }
  ],
  canHaveChildren: true
});

Builder.registerComponent('Hero', {
  inputs: [
    { name: 'title', type: 'string', defaultValue: 'Welcome to PDF Convert Master' },
    { name: 'subtitle', type: 'string', defaultValue: 'Convert your documents with ease' },
    { name: 'backgroundImage', type: 'file', allowedFileTypes: ['jpeg', 'jpg', 'png'] },
    { name: 'ctaText', type: 'string', defaultValue: 'Get Started' },
    { name: 'ctaLink', type: 'string', defaultValue: '/signup' }
  ]
});

Builder.registerComponent('FeatureCard', {
  inputs: [
    { name: 'icon', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'link', type: 'string' }
  ]
});

Builder.registerComponent('PricingCard', {
  inputs: [
    { name: 'plan', type: 'string' },
    { name: 'price', type: 'string' },
    { name: 'features', type: 'list', subFields: [{ name: 'feature', type: 'string' }] },
    { name: 'popular', type: 'boolean', defaultValue: false },
    { name: 'ctaText', type: 'string', defaultValue: 'Choose Plan' }
  ]
});

export default Builder;