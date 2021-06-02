(window.webpackJsonp=window.webpackJsonp||[]).push([[6],{70:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return l})),n.d(t,"metadata",(function(){return r})),n.d(t,"toc",(function(){return s})),n.d(t,"default",(function(){return p}));var a=n(3),i=n(7),o=(n(0),n(93)),l={id:"standard_transaction",title:"6 - The Standard Transaction"},r={unversionedId:"standard_transaction",id:"standard_transaction",isDocsHomePage:!1,title:"6 - The Standard Transaction",description:"You should now be well versed in a number of ways to lock up a coin using a Chialisp puzzle.  We have all the tools we need now to talk about the standard transaction format on the Chia network.",source:"@site/docs/standard_transaction.md",slug:"/standard_transaction",permalink:"/docs/standard_transaction",editUrl:"https://github.com/Chia-Network/chialisp-web/edit/master/docs/standard_transaction.md",version:"current",sidebar:"someSidebar",previous:{title:"5 - Common Functions in Chialisp",permalink:"/docs/common_functions"},next:{title:"The Great Chia Glossary",permalink:"/docs/glossary"}},s=[{value:"Pay to &quot;Delegated Puzzle&quot; or &quot;Hidden Puzzle&quot;",id:"pay-to-delegated-puzzle-or-hidden-puzzle",children:[]},{value:"The Chialisp",id:"the-chialisp",children:[]},{value:"Conclusion",id:"conclusion",children:[]}],d={toc:s};function p(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(o.a)("wrapper",Object(a.a)({},d,n,{components:t,mdxType:"MDXLayout"}),Object(o.a)("p",null,"You should now be well versed in a number of ways to lock up a coin using a Chialisp puzzle.  We have all the tools we need now to talk about the standard transaction format on the Chia network."),Object(o.a)("p",null,"Before you go through this section, it may be worth it to check out this ",Object(o.a)("a",{parentName:"p",href:"https://www.chia.net/2021/05/27/Agrgregated-Sigs-Taproot-Graftroot.html"},"blog post")," by Bram Cohen on why the standard transaction is the way it is."),Object(o.a)("h2",{id:"pay-to-delegated-puzzle-or-hidden-puzzle"},'Pay to "Delegated Puzzle" or "Hidden Puzzle"'),Object(o.a)("p",null,"If you remember from ",Object(o.a)("a",{parentName:"p",href:"/docs/coins_spends_and_wallets"},"part 2"),' we created a puzzle that paid to a "delegated puzzle": a puzzle that allows the solver to pass in a puzzle and solution to create their own conditions for the output.  This is one half of the functionality we want our standard transaction to have.'),Object(o.a)("p",null,'However, we also want the ability to pre-commit to a puzzle without revealing it, and let anybody with the knowledge of the "hidden" puzzle spend it.'),Object(o.a)("p",null,"But how do we pre-commit to this hidden puzzle?  We can curry it in, but if we perform the delegated spend case we will have to reveal the full puzzle including the curried in hidden puzzle and it will no longer be hidden.  We can't lock up a coin with the same puzzle anymore, or else people will be able to tell that the puzzle hash is the same and spend it without our consent.  Our delegated spend might not even make it to the network, a malicious node can just deny our transaction after seeing it and then publish the hidden spend case on their own."),Object(o.a)("p",null,"We can attempt to solve this by hashing the hidden puzzle.  This has some similar problems.  If you spend the hidden case even once, people can see any identical puzzle hashes later and spend them without your consent.  Furthermore, many people may try to use the same hidden puzzle.  If anyone reveals it, all coins locked up with that same puzzle can also be identified and spent.  We need the puzzle to be hidden, but also have some entropy that keeps it unique to us."),Object(o.a)("p",null,"The solution that the standard transaction uses is to derive a new private key from a) the hidden puzzle and b) the public key that can sign for the delegated spend case:"),Object(o.a)("p",null,Object(o.a)("inlineCode",{parentName:"p"},"synthetic_offset == sha256(hidden_puzzle_hash + original_public_key)")),Object(o.a)("p",null,"We then curry in the corresponding public key added to the original public key which becomes both the key that signs delegated spends ",Object(o.a)("em",{parentName:"p"},"and")," a way to verify that someone knows both the hidden puzzle and the original public key that was used to derive it."),Object(o.a)("p",null,"We'll look at the code in a moment, but here's a few terms to know before you look at it:"),Object(o.a)("ul",null,Object(o.a)("li",{parentName:"ul"},Object(o.a)("strong",{parentName:"li"},"hidden puzzle"),': a "hidden puzzle" that can be revealed and used as an alternate way to unlock the underlying funds'),Object(o.a)("li",{parentName:"ul"},Object(o.a)("strong",{parentName:"li"},"synthetic key offset"),": a private key cryptographically generated using the hidden puzzle and ",Object(o.a)("inlineCode",{parentName:"li"},"original_public_key")," as inputs"),Object(o.a)("li",{parentName:"ul"},Object(o.a)("strong",{parentName:"li"},"synthetic public key"),": the public key (curried in) that is the sum of ",Object(o.a)("inlineCode",{parentName:"li"},"original_public_key")," and the public key corresponding to ",Object(o.a)("inlineCode",{parentName:"li"},"synthetic_key_offset")),Object(o.a)("li",{parentName:"ul"},Object(o.a)("strong",{parentName:"li"},"original public key"),": a public key, where knowledge of the corresponding private key represents ownership of the coin"),Object(o.a)("li",{parentName:"ul"},Object(o.a)("strong",{parentName:"li"},"delegated puzzle"),': a delegated puzzle, as in "graftroot", which should return the desired conditions.'),Object(o.a)("li",{parentName:"ul"},Object(o.a)("strong",{parentName:"li"},"solution"),": the solution to the delegated or hidden puzzle")),Object(o.a)("h2",{id:"the-chialisp"},"The Chialisp"),Object(o.a)("p",null,"Here's the full source and then we'll break it down:"),Object(o.a)("pre",null,Object(o.a)("code",{parentName:"pre",className:"language-lisp"},'(mod\n\n    (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle solution)\n\n    ; "assert" is a macro that wraps repeated instances of "if"\n    ; usage: (assert A0 A1 ... An R)\n    ; all of A0, A1, ... An must evaluate to non-null, or an exception is raised\n    ; return the last item (if we get that far)\n\n    (defmacro assert items\n        (if (r items)\n            (list if (f items) (c assert (r items)) (q . (x)))\n            (f items)\n        )\n    )\n\n    (include condition_codes.clvm)\n    (include sha256tree1.clvm)\n\n    ; "is_hidden_puzzle_correct" returns true iff the hidden puzzle is correctly encoded\n\n    (defun-inline is_hidden_puzzle_correct (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle)\n      (=\n          SYNTHETIC_PUBLIC_KEY\n          (point_add\n              original_public_key\n              (pubkey_for_exp (sha256 original_public_key (sha256tree1 delegated_puzzle)))\n          )\n      )\n    )\n\n    ; "possibly_prepend_aggsig" is the main entry point\n\n    (defun-inline possibly_prepend_aggsig (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle conditions)\n      (if original_public_key\n          (assert\n              (is_hidden_puzzle_correct SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle)\n              conditions\n          )\n          (c (list AGG_SIG_ME SYNTHETIC_PUBLIC_KEY (sha256tree1 delegated_puzzle)) conditions)\n      )\n    )\n\n    ; main entry point\n\n    (possibly_prepend_aggsig\n        SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle\n        (a delegated_puzzle solution))\n)\n')),Object(o.a)("p",null,"That's probably a lot to digest so let's break it down piece by piece.  First, let's talk about the arguments:"),Object(o.a)("pre",null,Object(o.a)("code",{parentName:"pre",className:"language-lisp"},"(SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle solution)\n")),Object(o.a)("p",null,"All of these terms are defined above.  When we solve this puzzle:"),Object(o.a)("ul",null,Object(o.a)("li",{parentName:"ul"},Object(o.a)("inlineCode",{parentName:"li"},"SYNTHETIC_PUBLIC_KEY")," is curried in"),Object(o.a)("li",{parentName:"ul"},"We pass in ",Object(o.a)("inlineCode",{parentName:"li"},"original_public_key")," if it's the hidden spend or ",Object(o.a)("inlineCode",{parentName:"li"},"()")," if it's the delegated spend"),Object(o.a)("li",{parentName:"ul"},Object(o.a)("inlineCode",{parentName:"li"},"delegated_puzzle")," is the hidden puzzle if it's the hidden spend, or the delegated puzzle if it's the delegated spend"),Object(o.a)("li",{parentName:"ul"},Object(o.a)("inlineCode",{parentName:"li"},"solution")," is the solution to whatever is passed into ",Object(o.a)("inlineCode",{parentName:"li"},"delegated_puzzle"))),Object(o.a)("p",null,"As with most Chialisp programs, we'll start looking at the implementation from the bottom:"),Object(o.a)("pre",null,Object(o.a)("code",{parentName:"pre",className:"language-lisp"},"(possibly_prepend_aggsig\n    SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle\n    (a delegated_puzzle solution))\n")),Object(o.a)("p",null,"There's nothing much going on here, we're mostly just passing arguments to ",Object(o.a)("inlineCode",{parentName:"p"},"possibly_prepend_aggsig")," to start the program.  The only thing to note is that we're evaluating the delegated puzzle with the solution before passing it in.  This will result in a list of conditions that we will output as long as the rest of the puzzle checks out."),Object(o.a)("pre",null,Object(o.a)("code",{parentName:"pre",className:"language-lisp"},"(defun-inline possibly_prepend_aggsig (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle conditions)\n  (if original_public_key\n      (assert\n          (is_hidden_puzzle_correct SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle) ; hidden case\n          conditions\n      )\n      (c (list AGG_SIG_ME SYNTHETIC_PUBLIC_KEY (sha256tree1 delegated_puzzle)) conditions) ; delegated case\n  )\n)\n")),Object(o.a)("p",null,'This function is the main control flow logic that determines whether we\'re doing the "hidden" or "delegated" spend.  The first line just checks if an ',Object(o.a)("inlineCode",{parentName:"p"},"original_public_key")," was passed in.  In the delegated spend, we pass ",Object(o.a)("inlineCode",{parentName:"p"},"()")," for that argument, and since that evaluates to false, it works great as a switch to determine what we're doing."),Object(o.a)("p",null,"If the spend is the hidden spend, we pass most of our parameters to ",Object(o.a)("inlineCode",{parentName:"p"},"is_hidden_puzzle_correct")," and, as long as it doesn't fail, we just return whatever conditions are given to us.  If the spend is the delegated spend, we prepend a signature requirement from the curried in public key on the hash of the delegated puzzle."),Object(o.a)("pre",null,Object(o.a)("code",{parentName:"pre",className:"language-lisp"},"(defun-inline is_hidden_puzzle_correct (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle)\n  (=\n      SYNTHETIC_PUBLIC_KEY\n      (point_add\n          original_public_key\n          (pubkey_for_exp (sha256 original_public_key (sha256tree1 delegated_puzzle)))\n      )\n  )\n)\n")),Object(o.a)("p",null,"This is the Chialisp representation of what was explained in the section above.  A private key is any 32 bytes so we're going to use ",Object(o.a)("inlineCode",{parentName:"p"},"sha256")," (whose output is 32 bytes) to make sure our private key is derived from the ",Object(o.a)("inlineCode",{parentName:"p"},"original_public_key")," and the hash of the hidden puzzle.  We pass the resulting hash to ",Object(o.a)("inlineCode",{parentName:"p"},"pubkey_for_exp")," which turns our private key into a public key.  Then, we ",Object(o.a)("inlineCode",{parentName:"p"},"point_add")," this generated public key to our original pubkey to get our synthetic public key.  If it equals the curried in one, this function passes, otherwise it returns ",Object(o.a)("inlineCode",{parentName:"p"},"()")," and the ",Object(o.a)("inlineCode",{parentName:"p"},"assert")," from the previous function raises."),Object(o.a)("p",null,"You may wonder why we add the public key from our derived private key to the ",Object(o.a)("inlineCode",{parentName:"p"},"original_public_key")," when it's already part of the derivation.  This is because we use the ",Object(o.a)("inlineCode",{parentName:"p"},"SYNTHETIC_PUBLIC_KEY")," to sign for our delegated spends as well.  When you ",Object(o.a)("inlineCode",{parentName:"p"},"point_add")," two public keys, the private key for the resulting public key is the sum of the original private keys.  If we didn't add the ",Object(o.a)("inlineCode",{parentName:"p"},"original_public_key")," then anyone who knew the hidden puzzle could derive the synthetic private key and could then perform delegated spends!  Adding ",Object(o.a)("inlineCode",{parentName:"p"},"original_public_key")," ensures that there is still a secret component of the synthetic private key, even though half of can be known."),Object(o.a)("h2",{id:"conclusion"},"Conclusion"),Object(o.a)("p",null,"This puzzle secures almost all of the coins on the Chia network.  When you use the Chia Network wallet software, it is crawling the blockchain looking for coins locked up with this specific format.  The ",Object(o.a)("inlineCode",{parentName:"p"},"SYNTHETIC_PUBLIC_KEY")," it is looking for is actually using a hidden puzzle of ",Object(o.a)("inlineCode",{parentName:"p"},"(=)")," which is obviously invalid and fails immediately.  This is because most users of Chia don't need the hidden puzzle functionality for vanilla transactions.  But, by having the capabilities built in, it enables much cooler functionality later on.  This puzzle also makes for a fantastic inner puzzle of any smart contracts you may write."))}p.isMDXComponent=!0},93:function(e,t,n){"use strict";n.d(t,"a",(function(){return h}));var a=n(0),i=n.n(a);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var d=i.a.createContext({}),p=function(e){var t=i.a.useContext(d),n=t;return e&&(n="function"==typeof e?e(t):r(r({},t),e)),n},c={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},u=i.a.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),u=p(n),h=a,b=u["".concat(l,".").concat(h)]||u[h]||c[h]||o;return n?i.a.createElement(b,r(r({ref:t},d),{},{components:n})):i.a.createElement(b,r({ref:t},d))}));function h(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,l=new Array(o);l[0]=u;var r={};for(var s in t)hasOwnProperty.call(t,s)&&(r[s]=t[s]);r.originalType=e,r.mdxType="string"==typeof e?e:a,l[1]=r;for(var d=2;d<o;d++)l[d]=n[d];return i.a.createElement.apply(null,l)}return i.a.createElement.apply(null,n)}u.displayName="MDXCreateElement"}}]);