'use client';

import FileUpload from '@/components/FileUpload';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <div className="mx-auto max-w-6xl p-4 sm:p-8 md:p-12">
        <FileUpload />
      </div>
    </main>
  );
}
