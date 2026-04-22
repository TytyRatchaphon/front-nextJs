import * as React from "react";
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      linearGradient: React.SVGProps<SVGLinearGradientElement>;
      // Add others if they appear missing in future
    }
  }
}
