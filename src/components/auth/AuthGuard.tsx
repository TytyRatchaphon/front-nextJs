"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "antd";
import { ArrowRight, House, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, hasMounted, setMounted } = useAuthStore();
    const { isLoginModalOpen, openLoginModal, setLoginViewMode } = useUIStore();
    const router = useRouter();

    useEffect(() => {
        if (!hasMounted) {
            setMounted();
        }
    }, [hasMounted, setMounted]);

    if (!hasMounted) return null;

    if (!isLoggedIn) {
        return (
            <>
                <style jsx global>{`
                    .auth-guard-modal .ant-modal-content {
                        padding: 0 !important;
                        background: transparent !important;
                        box-shadow: none !important;
                    }

                    .auth-guard-modal .ant-modal {
                        max-width: calc(100vw - 24px);
                    }

                    @keyframes authGuardLift {
                        from {
                            opacity: 0;
                            transform: translateY(18px) scale(0.975);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

                    @keyframes authGuardGlow {
                        0%,
                        100% {
                            transform: scale(1);
                            opacity: 0.82;
                        }
                        50% {
                            transform: scale(1.08);
                            opacity: 1;
                        }
                    }

                    .auth-guard-surface {
                        animation: authGuardLift 320ms cubic-bezier(0.22, 1, 0.36, 1);
                    }

                    .auth-guard-orb {
                        animation: authGuardGlow 7s ease-in-out infinite;
                    }

                    .auth-guard-heading {
                        max-width: 320px;
                        margin: 20px auto 0;
                        font-size: 28px;
                        line-height: 1.28 !important;
                        letter-spacing: -0.01em;
                    }

                    .auth-guard-actions {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        margin-top: 32px;
                    }

                    @media (min-width: 640px) {
                        .auth-guard-heading {
                            font-size: 30px;
                            line-height: 1.24 !important;
                        }
                    }
                `}</style>

                <Modal
                    open={!isLoginModalOpen}
                    centered
                    width={460}
                    zIndex={1600}
                    maskClosable={false}
                    closable={false}
                    keyboard={false}
                    title={null}
                    footer={null}
                    className="auth-guard-modal"
                    styles={{
                        body: { padding: 0 },
                        content: { padding: 0, background: "transparent", boxShadow: "none" },
                        mask: {
                            backdropFilter: "blur(10px)",
                            background: "rgba(34, 10, 13, 0.52)",
                        },
                    }}
                >
                    <div className="auth-guard-surface overflow-hidden rounded-[30px] border border-[#f4cbc4] bg-[linear-gradient(180deg,#fffaf9_0%,#ffffff_100%)] shadow-[0_28px_90px_rgba(73,18,24,0.35)]">
                        <div className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-9">
                            <div className="auth-guard-orb absolute -left-12 top-0 h-28 w-28 rounded-full bg-[#ffd8dd] blur-3xl" />
                            <div className="auth-guard-orb absolute right-[-28px] top-8 h-24 w-24 rounded-full bg-[#ffe9dd] blur-3xl" />

                            <div className="relative z-10 mx-auto max-w-[332px] text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#ef304b_0%,#ce1736_100%)] text-white shadow-[0_18px_40px_rgba(227,28,61,0.22)]">
                                    <ShieldCheck className="h-7 w-7" />
                                </div>

                                <h3 className="auth-guard-heading font-semibold !text-[#23181b]">
                                    <span className="block">ต้องเข้าสู่ระบบก่อน</span>
                                    <span className="block">ใช้งานหน้านี้</span>
                                </h3>

                                <div className="auth-guard-actions">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLoginViewMode("login");
                                            openLoginModal();
                                        }}
                                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#ef304b_0%,#ce1736_100%)] px-5 py-4 text-base font-semibold !text-white shadow-[0_18px_40px_rgba(227,28,61,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(227,28,61,0.28)]"
                                    >
                                        เข้าสู่ระบบ
                                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => router.push("/")}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#edd4cf] bg-white px-5 py-4 text-base font-semibold text-[#5e474b] transition-all duration-200 hover:bg-[#fff6f5] hover:text-[#23181b]"
                                    >
                                        <House className="h-4 w-4" />
                                        กลับหน้าหลัก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </>
        );
    }

    return <>{children}</>;
}
