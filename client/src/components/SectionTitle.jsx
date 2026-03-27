const FeatureCard = ({ title, desc, icon }) => {
  return (
    <div className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-100 transition-all duration-300 transform hover:-translate-y-2">
      {/* Icon support added */}
      {icon && (
        <div className="text-4xl mb-6 bg-emerald-50 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-emerald-600 transition-colors">
        {title}
      </h3>
      
      <p className="text-gray-500 text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
};

export default FeatureCard;