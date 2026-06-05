import React from "react"
import { useAuth } from "@/context/auth-context"
import { useLocation, Link } from "wouter"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { afterAuthPath } from "@/lib/sign-in-return"
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react"
import { HUB_KIND_OPTIONS, type HubKindValue } from "@/lib/hub-display"
import { motion, AnimatePresence } from "framer-motion"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

const loginInputClass =
    "h-auto rounded-xl border-2 border-border bg-background-secondary/50 px-5 py-4 font-bold shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-0"

export default function AnimatedAuthPage() {
    const { toast } = useToast()
    const [, setLocation] = useLocation()
    const { login, register, logout } = useAuth()
    const [mode, setMode] = React.useState<'login' | 'register'>('login')
    const [role, setRole] = React.useState<'student' | 'hubOwner'>('student')

    // Form state
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [name, setName] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [hubName, setHubName] = React.useState("")
    const [hubLocation, setHubLocation] = React.useState("")
    const [hubKind, setHubKind] = React.useState<HubKindValue>("other")
    const [busy, setBusy] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (busy) return

        if (mode === 'register' && password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive"
            })
            return
        }

        setBusy(true)
        try {
            if (mode === 'login') {
                const user = await login(email, password)

                // Role validation
                const isStudentUI = role === 'student'
                const isHubOwnerUI = role === 'hubOwner'

                const isUserRole = user.baseRole === 'user'
                const isHubRole = user.baseRole === 'hub' || user.baseRole === 'super_admin'

                if (isStudentUI && !isUserRole) {
                    logout()
                    toast({
                        title: "Access Denied",
                        description: "The provided credentials do not belong to a student account.",
                        variant: "destructive"
                    })
                    return
                }

                if (isHubOwnerUI && !isHubRole) {
                    logout()
                    toast({
                        title: "Access Denied",
                        description: "The provided credentials do not belong to a hub owner account.",
                        variant: "destructive"
                    })
                    return
                }

                toast({
                    title: "Welcome back",
                    description: `Welcome back, ${user.name}!`,
                })
                setLocation(afterAuthPath(user))
            } else {
                if (role === 'student') {
                    const user = await register({
                        name,
                        email,
                        password,
                        accountType: "user"
                    })
                    toast({
                        title: "Success",
                        description: "Account created successfully!",
                    })
                    setLocation(afterAuthPath(user))
                } else {
                    const user = await register({
                        name,
                        email,
                        password,
                        accountType: "hub",
                        hubName: hubName.trim(),
                        hubLocation: hubLocation.trim(),
                        hubKind
                    })
                    toast({
                        title: "Success",
                        description: "Hub account created successfully!",
                    })
                    setLocation(afterAuthPath(user))
                }
            }
        } catch (err) {
            toast({
                title: "Authentication Failed",
                description: err instanceof ApiError ? err.message : "We couldn't verify your credentials. Please try again.",
                variant: "destructive"
            })
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden selection:bg-primary/30">
            <div className={`relative w-full min-h-screen lg:h-screen overflow-hidden flex flex-col lg:flex-row ${mode === 'login' ? '' : 'lg:flex-row-reverse'}`}>
                {/* Global Gradient Overlay - Subtle */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-surface opacity-[0.01] pointer-events-none" />
                
                <Link href="/">
                    <button className="absolute top-6 left-6 z-50 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity backdrop-blur-sm px-4 py-2 ">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-bold uppercase tracking-wider text-xs">Back to Hub</span>
                    </button>
                </Link>

                {/* Left: Form Section */}
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative z-10 flex-1 flex flex-col items-center py-12 px-8 lg:px-20 lg:py-16 lg:h-screen lg:overflow-y-auto bg-surface"
                >
                    <div className="w-full max-w-md my-auto relative">
                        {/* Header Section */}
                        <div className="mb-10 relative text-center lg:text-left">
                            <h1 className="text-4xl font-bold tracking-tighter text-foreground mb-3">
                                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                            </h1>
                            <p className="text-muted-foreground font-medium text-base">
                                {mode === 'login'
                                    ? 'Login to continue your learning journey.'
                                    : 'Register to access your hub dashboard.'}
                            </p>
                        </div>

                        {/* Role Selector */}
                        <div className="mb-8 relative p-1 bg-muted border border-border flex gap-1">
                            <button
                                onClick={() => setRole('student')}
                                className={`relative flex-1 py-3.5 text-sm font-bold transition-all duration-300 z-10 ${role === 'student'
                                    ? 'text-primary-foreground'
                                    : 'text-muted-foreground hover:text-muted-foreground'
                                    }`}
                            >
                                {role === 'student' && (
                                    <motion.div
                                        layoutId="role-bg"
                                        className="absolute inset-0 bg-primary shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                    />
                                )}
                                <span className="relative z-20">Student</span>
                            </button>

                            <button
                                onClick={() => setRole('hubOwner')}
                                className={`relative flex-1 py-3.5 text-sm font-bold transition-all duration-300 z-10 ${role === 'hubOwner'
                                    ? 'text-primary-foreground'
                                    : 'text-muted-foreground hover:text-muted-foreground'
                                    }`}
                            >
                                {role === 'hubOwner' && (
                                    <motion.div
                                        layoutId="role-bg"
                                        className="absolute inset-0 bg-primary shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                    />
                                )}
                                <span className="relative z-20">Hub Owner</span>
                            </button>
                        </div>

                        {/* Form - White borders by default, blue on hover/focus */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {mode === 'register' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                        className="space-y-2"
                                    >
                                        <label className="caption-scale font-bold uppercase tracking-widest text-primary ml-1">
                                            Full Name
                                        </label>
                                        <Input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                            className={loginInputClass}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="caption-scale font-bold uppercase tracking-widest text-primary ml-1">
                                    Email Address
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className={loginInputClass}
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {mode === 'register' && role === 'hubOwner' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="caption-scale font-bold uppercase tracking-widest text-primary ml-1">
                                                Hub Name
                                            </label>
                                            <Input
                                                type="text"
                                                value={hubName}
                                                onChange={(e) => setHubName(e.target.value)}
                                                placeholder="e.g. Central Library"
                                                required
                                                className={loginInputClass}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="caption-scale font-bold uppercase tracking-widest text-primary ml-1">
                                                Hub Location
                                            </label>
                                            <Input
                                                type="text"
                                                value={hubLocation}
                                                onChange={(e) => setHubLocation(e.target.value)}
                                                placeholder="City or Campus"
                                                required
                                                className={loginInputClass}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="caption-scale font-bold uppercase tracking-widest text-primary ml-1">
                                                Hub Type
                                            </label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className={cn(loginInputClass, "flex items-center justify-between text-left")}
                                                    >
                                                        {HUB_KIND_OPTIONS.find(opt => opt.value === hubKind)?.label || "Select hub type"}
                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-surface rounded-xl border border-border shadow-xl p-1">
                                                    {HUB_KIND_OPTIONS.map((opt) => (
                                                        <DropdownMenuItem
                                                            key={opt.value}
                                                            onSelect={() => setHubKind(opt.value as HubKindValue)}
                                                            className="px-5 py-3 focus:bg-primary/5 focus:text-primary cursor-pointer font-bold rounded-xl"
                                                        >
                                                            {opt.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="caption-scale font-bold uppercase tracking-widest text-primary ml-1">
                                    Password
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className={loginInputClass}
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {mode === 'register' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                        className="space-y-2"
                                    >
                                        <label className="caption-scale font-bold uppercase tracking-widest text-primary ml-1">
                                            Confirm Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            required
                                            className={loginInputClass}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full flex items-center justify-center gap-3 rounded-xl py-5 font-black uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group shadow-lg"
                            >
                                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span className="relative z-10">{mode === 'login' ? 'Login' : 'Create Account'}</span>
                            </button>
                        </form>

                        <div className="mt-10 text-center">
                            <p className="text-sm font-bold text-muted-foreground">
                                {mode === 'login'
                                    ? "New to the network?"
                                    : 'Already have an account?'}

                                <button
                                    onClick={() =>
                                        setMode(mode === 'login' ? 'register' : 'login')
                                    }
                                    className="ml-2 text-primary hover:underline font-black uppercase tracking-tight"
                                >
                                    {mode === 'login' ? 'Register' : 'Sign In'}
                                </button>
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-12 text-center opacity-30">
                        <p className="caption-scale font-black uppercase tracking-[0.4em] text-primary">
                            Neev Phygital System &copy; 2026
                        </p>
                    </div>
                </motion.div>

                {/* Right: Illustration Section */}
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative flex-1 overflow-hidden hidden lg:flex items-center justify-center lg:h-screen bg-muted transition-colors duration-500"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-xl -ml-48 -mb-48" />

                    <div className="relative z-10 flex flex-col items-center text-center px-20">
                        <div className="relative w-full max-w-[480px] mb-12">
                            <img
                                src={mode === 'login' ? "/images/Login-rafiki.png" : "/images/Sign up-rafiki.png"}
                                alt={mode === 'login' ? "Login Illustration" : "Sign Up Illustration"}
                                className="w-full h-auto drop-shadow-2xl relative z-10"
                            />
                        </div>
                        
                        <div className="max-w-md space-y-4">
                            <h2 className="text-2xl font-bold tracking-tight text-primary leading-tight">
                                Connecting students to physical assets digitally.
                            </h2>
                            <p className="text-muted-foreground font-medium text-sm">
                                The largest network of campus hubs ensuring every student has access to the resources they need.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
