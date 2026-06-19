# Lottie animations

Drop your exported Lottie `.json` files in this folder, then render them with
the `<LottieIcon />` component.

```tsx
import { LottieIcon } from "@/components/ui/lottie-icon";
import myIcon from "@/assets/lottie/my-icon.json";

// Basic
<LottieIcon animationData={myIcon} size={64} />

// Play only on hover (great for nav / button icons)
<LottieIcon animationData={myIcon} size={32} playOnHover />

// Custom speed, no loop
<LottieIcon animationData={myIcon} size={48} loop={false} speed={1.5} />
```

Everything renders client-side with the open-source `lottie-react` player —
no subscription, account, or external service is required.
