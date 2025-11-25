import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'King Bryan - Web3 Community Manager',
  description: 'Professional Web3 Community Manager with 3+ years experience. Proven track record of building and nurturing thriving communities of 150,000+ members.',
  icons: {
    icon: '/favicon.ico',
    apple: '/profile.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    // Helper to detect messages originating from Talisman or chrome extensions
    function isTalismanOrExtensionMessage(arg){
      try{
        if(!arg) return false;
        if(typeof arg === 'string'){
          if(arg.includes('Talisman') || arg.includes('chrome-extension')) return true;
          return false;
        }
        if(arg instanceof Error){
          if((arg.message && (arg.message.includes('Talisman')||arg.message.includes('chrome-extension'))) || (arg.stack && arg.stack.includes('chrome-extension'))) return true;
        }
        if(typeof arg === 'object'){
          if(arg.message && (arg.message.includes('Talisman') || arg.message.includes('chrome-extension'))) return true;
          if(arg.stack && arg.stack.includes('chrome-extension')) return true;
        }
      }catch(e){}
      return false;
    }

    // Override console.error / warn to filter noisy extension errors
    var _origError = console.error.bind(console);
    var _origWarn = console.warn.bind(console);
    console.error = function(...args){
      for(var i=0;i<args.length;i++){
        if(isTalismanOrExtensionMessage(args[i])) return;
      }
      _origError.apply(console, args);
    };
    console.warn = function(...args){
      for(var i=0;i<args.length;i++){
        if(isTalismanOrExtensionMessage(args[i])) return;
      }
      _origWarn.apply(console, args);
    };

    // Catch runtime errors coming from extensions and suppress them
    window.addEventListener('error', function(e){
      try{
        if(e && e.filename && e.filename.indexOf('chrome-extension') !== -1){
          e.preventDefault();
          return true;
        }
        if(e && e.message && e.message.indexOf('Talisman') !== -1){
          e.preventDefault();
          return true;
        }
      }catch(_){ }
    }, true);

    // Catch unhandled promise rejections raised by extensions
    window.addEventListener('unhandledrejection', function(e){
      try{
        var r = e && e.reason;
        if(!r) return;
        if(typeof r === 'string' && (r.indexOf('Talisman') !== -1 || r.indexOf('chrome-extension') !== -1)){
          e.preventDefault();
          return true;
        }
        if(r && r.message && (r.message.indexOf('Talisman') !== -1 || r.message.indexOf('chrome-extension') !== -1)){
          e.preventDefault();
          return true;
        }
        if(r && r.stack && r.stack.indexOf('chrome-extension') !== -1){
          e.preventDefault();
          return true;
        }
      }catch(_){ }
    }, true);

    // Remove known talisman globals if present (best-effort)
    try{
      if(window.talismanEthereumProvider) try{ delete window.talismanEthereumProvider; }catch(_){}
      if(window.__talisman) try{ delete window.__talisman; }catch(_){}
    }catch(_){ }

  }catch(err){/* swallow */}
})();`,
          }}
        />
      </head>
      <body className={`${inter.className} transition-colors duration-300 bg-black`}>
        {children}
      </body>
    </html>
  );
}