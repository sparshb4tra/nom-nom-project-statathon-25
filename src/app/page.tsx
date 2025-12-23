import FileUpload from '@/components/FileUpload';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 md:px-12 py-8 md:py-16">
        <FileUpload />
      </div>
    </main>
  );
}
