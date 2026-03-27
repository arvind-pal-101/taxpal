const Footer = () => {
  return (
    <footer className="bg-[#061612] text-gray-400 py-16 mt-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-bold text-2xl mb-4">
              Tax<span className="text-emerald-500">Pal</span>
            </h3>
            <p className="text-sm leading-relaxed max-w-xs">
              Empowering freelancers and professionals with smart financial tools and tax clarity.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it works</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Tax Estimator</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-emerald-900/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 TaxPal. Built with ❤️ for Freelancers.</p>
          <div className="flex gap-6">
            <span className="hover:text-emerald-500 cursor-pointer">Twitter</span>
            <span className="hover:text-emerald-500 cursor-pointer">LinkedIn</span>
            <span className="hover:text-emerald-500 cursor-pointer">Instagram</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;