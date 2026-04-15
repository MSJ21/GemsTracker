import { useMemo } from 'react';
import { Sun, Sunset, Moon, Quote } from 'lucide-react';

interface Quote {
  en: string;
  ta: string;
  author?: string;
}

const quotes: Quote[] = [
  { en: 'The secret of getting ahead is getting started.', ta: 'முன்னேறுவதன் ரகசியம் தொடங்குவதே.', author: 'Mark Twain' },
  { en: 'Believe you can and you\'re halfway there.', ta: 'நீ முடியும் என நம்பு, பாதி வழி கடந்துவிட்டாய்.', author: 'T. Roosevelt' },
  { en: 'It always seems impossible until it\'s done.', ta: 'முடிக்கும் வரை எல்லாமே சாத்தியமற்றதாகத் தெரியும்.', author: 'Nelson Mandela' },
  { en: 'Dream big, work hard, stay focused.', ta: 'பெரிதாக கனவு காண், கடினமாக உழை, கவனமாக இரு.' },
  { en: 'Small steps every day lead to big results.', ta: 'தினமும் சிறு அடிகளே பெரும் வெற்றியை தரும்.' },
  { en: 'Your only limit is your mind.', ta: 'உன் மனமே உனது ஒரே எல்லை.' },
  { en: 'Push yourself, because no one else will do it for you.', ta: 'உன்னை நீயே தூண்டிக்கொள், ஏனெனில் வேறு யாரும் செய்ய மாட்டார்கள்.' },
  { en: 'Great things never come from comfort zones.', ta: 'வசதியான இடத்திலிருந்து பெரிய சாதனைகள் வராது.' },
  { en: 'Work hard in silence, let success make the noise.', ta: 'அமைதியாக உழை, வெற்றியே சத்தம் போடட்டும்.' },
  { en: 'Don\'t stop when you\'re tired, stop when you\'re done.', ta: 'களைப்பில் நிறுத்தாதே, முடிந்ததும் நிறுத்து.' },
  { en: 'Success is the sum of small efforts, repeated daily.', ta: 'வெற்றி என்பது தினமும் திரும்ப திரும்ப செய்யும் சிறு முயற்சிகளின் கூட்டுத்தொகை.', author: 'R. Collier' },
  { en: 'Wake up with determination. Go to bed with satisfaction.', ta: 'உறுதியுடன் விழி. திருப்தியுடன் தூங்கு.' },
  { en: 'The harder you work, the luckier you get.', ta: 'கடினமாக உழைக்க உழைக்க, அதிர்ஷ்டம் அதிகமாகும்.' },
  { en: 'Focus on being productive instead of being busy.', ta: 'பிஸியாக இருப்பதை விட ஆக்கப்பூர்வமாக இரு.' },
  { en: 'You don\'t have to be great to start, but you have to start to be great.', ta: 'தொடங்க சிறப்பானவராக இருக்க வேண்டியதில்லை, சிறப்பாக இருக்க தொடங்க வேண்டும்.' },
];

function getGreeting(hour: number): { text: string; icon: typeof Sun } {
  if (hour < 12) return { text: 'Good Morning',   icon: Sun };
  if (hour < 17) return { text: 'Good Afternoon', icon: Sunset };
  return               { text: 'Good Evening',    icon: Moon };
}

function getTamilGreeting(hour: number): string {
  if (hour < 12) return 'காலை வணக்கம்';
  if (hour < 17) return 'மதிய வணக்கம்';
  return               'மாலை வணக்கம்';
}

interface Props {
  name?: string;
}

export function GreetingWidget({ name }: Props) {
  const now  = new Date();
  const hour = now.getHours();
  const { text: greeting, icon: Icon } = getGreeting(hour);
  const tamilGreeting = getTamilGreeting(hour);

  const quote = useMemo(() => {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
    return quotes[dayOfYear % quotes.length];
  }, []);

  const day = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 p-5 text-white shadow-lg shadow-primary-900/20">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-5 w-5 text-yellow-300" />
            <span className="text-sm font-medium text-primary-100">{tamilGreeting}</span>
          </div>
          <h3 className="text-xl font-bold">
            {greeting}{name ? `, ${name.split(' ')[0]}` : ''}!
          </h3>
          <p className="mt-0.5 text-xs text-primary-200">{day}</p>
        </div>
      </div>

      <div className="relative mt-4 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
        <Quote className="mb-1.5 h-4 w-4 text-white/50" />
        <p className="text-sm font-medium leading-relaxed text-white">{quote.en}</p>
        <p className="mt-1 text-xs italic text-primary-200">{quote.ta}</p>
        {quote.author && <p className="mt-1 text-xs text-white/50">— {quote.author}</p>}
      </div>
    </div>
  );
}
