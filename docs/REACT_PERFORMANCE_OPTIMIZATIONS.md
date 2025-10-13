# React Performance Optimizations Guide

This document provides examples and best practices for optimizing React components in the Para Connect application.

## Table of Contents
1. [React.memo](#reactmemo)
2. [useMemo](#usememo)
3. [useCallback](#usecallback)
4. [Lazy Loading & Code Splitting](#lazy-loading--code-splitting)
5. [Virtual Scrolling](#virtual-scrolling)
6. [Image Optimization](#image-optimization)
7. [Component-Specific Optimizations](#component-specific-optimizations)

---

## React.memo

Use `React.memo` to prevent unnecessary re-renders of functional components when props haven't changed.

### Example: ChatMessage Component

```tsx
import { memo } from 'react';

interface ChatMessageProps {
  message: string;
  timestamp: string;
  sender: string;
  isCurrentUser: boolean;
}

// Without memo - re-renders every time parent updates
const ChatMessage = ({ message, timestamp, sender, isCurrentUser }: ChatMessageProps) => {
  return (
    <div className={`message ${isCurrentUser ? 'message-self' : 'message-other'}`}>
      <div className="message-header">
        <span className="sender">{sender}</span>
        <span className="timestamp">{timestamp}</span>
      </div>
      <div className="message-content">{message}</div>
    </div>
  );
};

// With memo - only re-renders when props change
export default memo(ChatMessage);

// With custom comparison function for complex objects
export default memo(ChatMessage, (prevProps, nextProps) => {
  return (
    prevProps.message === nextProps.message &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.sender === nextProps.sender &&
    prevProps.isCurrentUser === nextProps.isCurrentUser
  );
});
```

### When to Use React.memo:
- Components that receive the same props frequently
- Components with expensive render operations
- List items that don't change often
- Components deep in the tree that re-render unnecessarily

### When NOT to Use React.memo:
- Components that always receive different props
- Simple components with minimal render cost
- Components that rarely re-render

---

## useMemo

Use `useMemo` to cache expensive computations between renders.

### Example: Dashboard Statistics

```tsx
import { useMemo } from 'react';

interface CheckIn {
  id: string;
  mood: string;
  timestamp: string;
  concerns: string[];
}

interface DashboardProps {
  checkIns: CheckIn[];
}

const Dashboard = ({ checkIns }: DashboardProps) => {
  // Without useMemo - recalculates on every render
  const stats = calculateStats(checkIns);

  // With useMemo - only recalculates when checkIns changes
  const stats = useMemo(() => {
    return {
      total: checkIns.length,
      avgMoodScore: calculateAverageMood(checkIns),
      concernsCount: checkIns.reduce((sum, c) => sum + c.concerns.length, 0),
      recentActivity: checkIns.slice(0, 5),
    };
  }, [checkIns]);

  // Complex filtering example
  const filteredCheckIns = useMemo(() => {
    return checkIns
      .filter(c => c.concerns.length > 0)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [checkIns]);

  return (
    <div>
      <h2>Dashboard</h2>
      <div>Total Check-ins: {stats.total}</div>
      <div>Average Mood: {stats.avgMoodScore}</div>
      <div>Total Concerns: {stats.concernsCount}</div>
    </div>
  );
};
```

### When to Use useMemo:
- Expensive calculations (filtering, sorting, mapping large arrays)
- Complex object transformations
- Creating derived data from props or state
- Preventing unnecessary re-renders of child components

### When NOT to Use useMemo:
- Simple calculations (adding two numbers)
- Primitive value transformations
- When the dependency array changes frequently

---

## useCallback

Use `useCallback` to cache function references between renders, especially when passing callbacks to child components.

### Example: Chat Input with Callbacks

```tsx
import { useState, useCallback, memo } from 'react';

// Child component wrapped in memo
const ChatInput = memo(({ onSend, onTyping }: {
  onSend: (message: string) => void;
  onTyping: () => void;
}) => {
  const [value, setValue] = useState('');

  return (
    <div>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onTyping();
        }}
      />
      <button onClick={() => {
        onSend(value);
        setValue('');
      }}>
        Send
      </button>
    </div>
  );
});

// Parent component
const ChatContainer = () => {
  const [messages, setMessages] = useState<string[]>([]);

  // Without useCallback - new function on every render
  // This causes ChatInput to re-render even though it's wrapped in memo
  const handleSend = (message: string) => {
    setMessages(prev => [...prev, message]);
  };

  // With useCallback - same function reference between renders
  const handleSend = useCallback((message: string) => {
    setMessages(prev => [...prev, message]);
  }, []); // No dependencies - function never changes

  const handleTyping = useCallback(() => {
    console.log('User is typing...');
  }, []);

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
};
```

### When to Use useCallback:
- Functions passed to memoized child components
- Functions used as dependencies in other hooks
- Event handlers passed as props
- Functions used in useEffect dependencies

### When NOT to Use useCallback:
- Functions only used within the component
- Functions that change on every render anyway
- Simple event handlers not passed as props

---

## Lazy Loading & Code Splitting

Split your application into smaller chunks that load on demand.

### Example: Route-Level Code Splitting

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </Suspense>
);
```

### Example: Component-Level Code Splitting

```tsx
import { lazy, Suspense, useState } from 'react';

// Heavy component loaded only when needed
const HeavyChart = lazy(() => import('./components/HeavyChart'));

const Dashboard = () => {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => setShowChart(true)}>
        Show Chart
      </button>

      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
};
```

---

## Virtual Scrolling

For large lists, only render visible items.

### Example: Using react-window

```tsx
import { FixedSizeList } from 'react-window';

interface Message {
  id: string;
  text: string;
  timestamp: string;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    return (
      <div style={style} className="message-row">
        <div className="message-text">{message.text}</div>
        <div className="message-time">{message.timestamp}</div>
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

---

## Image Optimization

### Example: Lazy Loading Images

```tsx
import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

const LazyImage = ({ src, alt, placeholder, className }: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '/placeholder.png');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver;

    if (imageRef && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        {
          rootMargin: '50px',
        }
      );

      observer.observe(imageRef);
    } else {
      // Fallback for browsers without IntersectionObserver
      setImageSrc(src);
    }

    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [src, imageRef]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
};
```

---

## Component-Specific Optimizations

### ChatInterface Component

```tsx
import { useState, useCallback, useMemo, memo } from 'react';

// Memoized message component
const Message = memo(({ message, isCurrentUser }: {
  message: { id: string; text: string; timestamp: string };
  isCurrentUser: boolean;
}) => (
  <div className={`message ${isCurrentUser ? 'self' : 'other'}`}>
    <p>{message.text}</p>
    <span className="text-xs">{message.timestamp}</span>
  </div>
));

interface ChatInterfaceProps {
  userId: string;
  recipientId: string;
}

const ChatInterface = ({ userId, recipientId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
  }>>([]);
  const [inputValue, setInputValue] = useState('');

  // Memoize filtered messages
  const displayMessages = useMemo(() => {
    return messages.filter(m =>
      (m.senderId === userId) || (m.senderId === recipientId)
    );
  }, [messages, userId, recipientId]);

  // Memoize callbacks
  const handleSend = useCallback((text: string) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      senderId: userId,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
  }, [userId]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <div className="chat-interface">
      <div className="messages">
        {displayMessages.map(message => (
          <Message
            key={message.id}
            message={message}
            isCurrentUser={message.senderId === userId}
          />
        ))}
      </div>
      <div className="input-area">
        <input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button onClick={() => handleSend(inputValue)}>Send</button>
      </div>
    </div>
  );
};

export default memo(ChatInterface);
```

### Dashboard Component

```tsx
import { useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface DashboardProps {
  caregiverId: string;
}

const Dashboard = ({ caregiverId }: DashboardProps) => {
  // Use React Query for data fetching with caching
  const { data: checkIns, isLoading } = useQuery({
    queryKey: ['checkIns', caregiverId],
    queryFn: () => fetchCheckIns(caregiverId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoize expensive calculations
  const stats = useMemo(() => {
    if (!checkIns) return null;

    return {
      total: checkIns.length,
      today: checkIns.filter(c => isToday(c.timestamp)).length,
      concerns: checkIns.filter(c => c.concerns.length > 0).length,
      avgMood: calculateAverageMood(checkIns),
    };
  }, [checkIns]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="dashboard">
      <StatsCard stats={stats} />
      <RecentActivity checkIns={checkIns} />
    </div>
  );
};

// Memoize sub-components
const StatsCard = memo(({ stats }: { stats: any }) => (
  <div className="stats-card">
    <div>Total: {stats?.total}</div>
    <div>Today: {stats?.today}</div>
    <div>Concerns: {stats?.concerns}</div>
    <div>Avg Mood: {stats?.avgMood}</div>
  </div>
));

export default memo(Dashboard);
```

---

## Performance Checklist

- [ ] Wrap expensive components in `React.memo`
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for functions passed to child components
- [ ] Implement lazy loading for routes
- [ ] Implement lazy loading for heavy components
- [ ] Use virtual scrolling for long lists
- [ ] Lazy load images with IntersectionObserver
- [ ] Configure React Query with appropriate cache times
- [ ] Remove console.logs from production builds
- [ ] Use production build for deployment
- [ ] Enable gzip/brotli compression
- [ ] Implement code splitting
- [ ] Optimize images (WebP, compression, responsive)
- [ ] Use CSS containment for isolated components
- [ ] Minimize bundle size by removing unused dependencies

---

## Measuring Performance

### Using React DevTools Profiler

```tsx
import { Profiler } from 'react';

const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

const App = () => (
  <Profiler id="App" onRender={onRenderCallback}>
    <Dashboard />
  </Profiler>
);
```

### Using Performance API

```tsx
// Measure component render time
const start = performance.now();
// ... render component
const end = performance.now();
console.log(`Render took ${end - start}ms`);

// Mark important events
performance.mark('dashboard-loaded');
performance.measure('dashboard-load-time', 'navigationStart', 'dashboard-loaded');
```

---

## Additional Resources

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web.dev Performance](https://web.dev/performance/)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Bundle Size Analysis](https://bundlephobia.com/)