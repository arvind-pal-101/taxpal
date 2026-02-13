const FeatureCard = ({ title, desc }) => {
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
