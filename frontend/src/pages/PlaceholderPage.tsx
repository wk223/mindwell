interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
}

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-mint-100 to-cream-100 flex items-center justify-center mx-auto mb-6 shadow-soft">
            <span className="text-3xl">{icon}</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint-50 text-mint-600 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-400" />
            即将上线
          </div>
        </div>
      </div>
    </div>
  );
}
