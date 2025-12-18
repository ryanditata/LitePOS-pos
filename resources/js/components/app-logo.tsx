export default function AppLogo() {
    return (
        <>
            <div className="flex items-center">
                <div className="w-10 h-auto">
                    <img src="/images/logo-navbar.png" alt="Icon Dashboard" />
                </div>
                <div className="ml-2 grid flex-1 text-left text-base">
                    <span className="truncate leading-tight font-semibold">LitePOS</span>
                </div>
            </div>
        </>
    );
}
