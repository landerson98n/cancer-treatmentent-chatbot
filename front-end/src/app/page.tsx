'use client'
import ChatBot from '@/components/CancerStudyChatBot';
import PageContainer from '@/components/layout/page-container';

export default function Home() {
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-2">
        <ChatBot />
      </div>
    </PageContainer>
  );
}
