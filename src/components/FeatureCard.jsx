/*const FeatureCard = ({ title, desc }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        {title}
      </h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  );
};

export default FeatureCard;
*/
const FeatureCard = ({ title, desc, icon }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

      {/* soft hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>

      {/* content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* centered icon */}
        {icon && (
          <div className="w-14 h-14 mb-5 flex items-center justify-center rounded-2xl bg-blue-100 text-blue-600 text-2xl">
            {icon}
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {title}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
          {desc}
        </p>

      </div>
    </div>
  );
};

export default FeatureCard;

