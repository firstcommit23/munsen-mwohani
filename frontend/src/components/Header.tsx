import logo from '../assets/logo2.png';

export default function Header() {
    return (
        <header className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
                <div
                    style={{
                        backgroundImage: `url(${logo})`,
                        backgroundSize: '7rem auto',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '0px 0px',
                        width: '7rem',
                        height: '2.5rem',
                    }}
                    role="img"
                    aria-label="문센뭐하니"
                />
                <span className="ml-auto text-xs text-slate-400">
                    이마트 · 롯데마트
                </span>
            </div>
        </header>
    );
}
