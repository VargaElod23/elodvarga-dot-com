"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// ─── Config ──────────────────────────────────────────────────────────────────
// Change this to your Medium username
const MEDIUM_USERNAME = "vargaelod";
const MEDIUM_URL = `https://medium.com/@${MEDIUM_USERNAME}`;

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_COMMANDS = [
  "about",
  "experience",
  "projects",
  "skills",
  "education",
  "blog",
  "contact",
] as const;
type NavCommand = (typeof NAV_COMMANDS)[number];

const ALL_COMMANDS = [
  ...NAV_COMMANDS,
  "help",
  "clear",
  "whoami",
  "history",
  "sudo",
  "rm",
  "ls",
  "pwd",
  "date",
  "uptime",
  "neofetch",
] as const;

const experience = [
  {
    role: "Chief Technology Officer",
    company: "Shinso",
    period: "Jul 2025 — Present",
    location: "Remote",
    description:
      "Leading engineering at the intersection of blockchain infrastructure, compiler design, and AI-driven automation. Building cross-chain smart contract execution systems.",
    highlights: [
      "Designed & trained the Shinsō stack — App with aproprietary MoE model for smart contract translation",
      "Built hybrid ReAct + Plan & Act agentic pipeline for multi-step contract reasoning",
      "Implementing AST-to-IR pipelines with semantic mapping for cross-chain execution",
      "Edge RAG systems with MCP servers for real-time context retrieval",
    ],
    tech: ["TypeScript", "Python", "Solidity", "PyTorch", "MCP", "RAG"],
  },
  {
    role: "Partner Success Manager & Product Owner",
    company: "Sophon Labs",
    note: "zkSync L2",
    period: "Jan 2025 — Jul 2025",
    location: "Remote",
    description:
      "Led product development and ecosystem growth for Sophon Wallet on zkSync Layer 2.",
    highlights: [
      "Took Sophon Wallet from concept to production — account abstraction & auth",
      "Built wallet integration APIs & SDK adopted by 15+ DApps",
      "Managed technical relationships with 50+ ecosystem partners",
      "Coordinated token go-to-market & exchange technical integrations",
    ],
    tech: ["React", "Next.js", "TypeScript", "Solidity", "zkSync"],
  },
  {
    role: "Founder",
    company: "Lara Protocol",
    note: "Successfully Exited",
    period: "Jan 2024 — Jan 2025",
    location: "Remote",
    description:
      "Founded liquid staking & delegation protocol. $2M TVL. Exited via acquisition in Jan 2025.",
    highlights: [
      "Architected full-stack app: React frontend, Node.js backend, Solidity contracts",
      "Auto-compounding vault architecture with gas-optimized reward distribution",
      "Integrated with 5 major DeFi platforms on Taraxa ecosystem",
      "Built CI/CD with deterministic deployment & automated security checks",
    ],
    tech: ["Solidity", "React", "Node.js", "PostgreSQL", "Hardhat"],
  },
  {
    role: "DeFi Lead / Ecosystem Engineer",
    company: "Taraxa.io",
    period: "Mar 2022 — Jan 2025",
    location: "Remote",
    description:
      "Led DeFi strategy and built critical ecosystem infrastructure. Grew to 40+ apps and $4M TVL.",
    highlights: [
      "Founded taraSwap (DEX) — majority of daily trading volume (exited)",
      "Architected chain Explorer (MERN), Faucet, Community Site, developer SDKs",
      "Built Hype App — social listening with Elasticsearch real-time data pipeline",
      "Built governance contracts & protocol layer integrations from scratch",
    ],
    tech: [
      "Solidity",
      "React",
      "Node.js",
      "MongoDB",
      "Elasticsearch",
      "Python",
    ],
  },
  {
    role: "Blockchain & Full Stack Developer",
    company: "Keyko",
    period: "Jun 2021 — Apr 2022",
    location: "Remote",
    description:
      "Full-stack developer for enterprise blockchain projects with Ethereum Foundation, Near, and Polygon.",
    highlights: [
      "Led development of audio-NFT marketplace (MERN + Solidity/Polygon)",
      "Built Nevermined.io protocol integrations",
      "Designed software architecture & tokenomics for multiple projects",
    ],
    tech: ["React", "Node.js", "Solidity", "Hardhat", "Elasticsearch", "AWS"],
  },
  {
    role: "Cloud Solutions Engineer",
    company: "Bosch",
    period: "May 2020 — Jul 2021",
    location: "Cluj-Napoca, Romania",
    description:
      "Backend engineer for Autonomous Valet Parking — Level 5 autonomous driving project.",
    highlights: [
      "Built high-availability APIs with strict SLAs for autonomous systems",
      "Implemented monitoring, logging, alerting & post-mortem processes",
      "Applied rigorous TDD for mission-critical systems",
    ],
    tech: [
      "Java",
      "Spring Boot",
      "Python",
      "TypeScript",
      "Cloud Infrastructure",
    ],
  },
  {
    role: "Java Software Developer",
    company: "Fortech",
    note: "for Deutsche Telekom / Daimler AG",
    period: "May 2019 — May 2020",
    location: "Cluj-Napoca, Romania",
    description:
      "Backend developer on microservices migration project. Monolith to microservices transition.",
    highlights: [
      "Implemented backend features using Java/Spring with comprehensive testing",
      "Contributed to clean architecture principles during migration",
    ],
    tech: ["Java", "Spring Boot", "Maven", "MySQL", "Vaadin"],
  },
];

const projects = [
  {
    name: "Shinsō",
    tagline: "AI-Powered Cross-Chain Smart Contract Transpiler",
    description:
      "Proprietary MoE model specialized for smart contract transpilation and cross-chain code reasoning. Combines formal verification with AI-assisted code reasoning.",
    tech: ["Python", "PyTorch", "MCP", "RAG", "Compiler Design"],
    status: "active",
    url: null,
  },
  {
    name: "Lara Protocol",
    tagline: "Liquid Staking & Delegation Protocol",
    description:
      "One-click staking with auto-compounding. KYC-less, liquid staked tokens usable across DeFi. Reached $2M TVL before successful exit.",
    tech: ["Solidity", "React", "Node.js", "Hardhat"],
    status: "exited",
    url: "https://laraprotocol.com",
  },
  {
    name: "taraSwap",
    tagline: "Decentralized Exchange on Taraxa",
    description:
      "DEX accounting for the majority of daily trading volume on the Taraxa network. Successfully exited.",
    tech: ["Solidity", "React", "Node.js", "Web3.js"],
    status: "exited",
    url: "https://taraswap.app",
  },
  {
    name: "Rand.app",
    tagline: "DeFi yield platform.",
    description:
      "Regulated and compliant since 2021, Earn up to 6,50% on your savings, Grow your balance daily with industry-leading interest and the highest standards of security.",
    tech: ["React", "Node.js", "Solidity", "Foundry", "Golang", "Low Latency", "Multi-Threaded", "Microservices", "Docker", "Kubernetes"],
    status: "shipped",
    url: "https://rand.app",
  },
  {
    name: "Sophon Wallet",
    tagline: "zkSync L2 Wallet with Account Abstraction",
    description:
      "Consumer-facing wallet with seamless auth, account abstraction, and wallet-as-a-service for 15+ integrated DApps.",
    tech: ["React", "TypeScript", "zkSync", "Solidity", "Foundry"],
    status: "shipped",
    url: "https://sophon.xyz",
  },
  {
    name: "Taraxa Explorer",
    tagline: "Blockchain Explorer & Developer Tools",
    description:
      "Full-featured chain explorer, faucet, community site, and developer SDKs for the Taraxa L1 ecosystem.",
    tech: ["React", "Node.js", "MongoDB", "Elasticsearch", "RabbitMQ", "Golang", "Microservices", "Docker", "Kubernetes"],
    status: "shipped",
    url: "https://explorer.taraxa.io",
  },
  {
    name: "Taraxa indexer",
    tagline: "Taraxa indexer for the Taraxa Network",
    description:
      "Taraxa indexer for the Taraxa network. Built with Golang and low latency multi-threaded architecture.",
    tech: ["Golang", "Low Latency", "Multi-Threaded", "Microservices", "Docker", "Kubernetes"],
    status: "shipped",
    url: "https://indexer.taraxa.io",
  },
  {
    name: "Taraxa Ficus Root Bridge",
    tagline: "Ficus Root Bridge for the Taraxa Network",
    description:
      "Ficus Root Bridge for the Taraxa network. Built with React and Node.js.",
    tech: ["React", "Node.js", "Solidity", "Foundry"],
    status: "shipped",
    url: "https://bridge.taraxa.io",
  },
  {
    name: "Hype App",
    tagline: "Social Listening & On-Chain Analytics",
    description:
      "Real-time social listening platform with Elasticsearch backend processing on-chain and social data streams.",
    tech: ["Python", "Elasticsearch", "React", "Node.js", "Solidity"],
    status: "shipped",
    url: "https://hype.taraxa.io",
  },
  {
    name: "Community Site",
    tagline: "Community Site for the Taraxa Network",
    description:
      "Community site for the Taraxa network. Built with React and Node.js.",
    tech: ["React", "Node.js"],
    status: "shipped",
    url: "https://taraxa.io",
  },
];

const skills = {
  "AI & ML": [
    "MoE Architecture",
    "Model Training & Finetuning",
    "RAG Systems",
    "Agentic Systems (ReAct, Plan & Act)",
    "MCP Protocol",
    "Multi-Agent Orchestration",
    "LLM Integration",
    "Edge AI",
  ],
  "Smart Contracts": [
    "Solidity (Expert)",
    "EVM Internals",
    "Gas Optimization",
    "Proxy Patterns (UUPS, Transparent, Beacon)",
    "Account Abstraction (ERC-4337)",
    "Hardhat / Foundry",
    "Security Auditing",
    "DeFi Primitives",
  ],
  Frontend: [
    "React",
    "Next.js",
    "TypeScript / JavaScript",
    "Tailwind CSS",
    "Vite / Webpack",
    "HTML5 / CSS3",
  ],
  Backend: [
    "Node.js / Express / NestJS",
    "Python / Flask",
    "REST APIs / GraphQL",
    "Microservices",
    "Event-Driven Architecture",
    "Java / Spring Boot",
  ],
  "Cloud & DevOps": [
    "AWS (EC2, S3, Lambda, RDS)",
    "GCP (Cloud Run, BigQuery)",
    "Docker / Kubernetes",
    "Terraform",
    "CI/CD (GitHub Actions, GitLab CI)",
  ],
  Databases: [
    "PostgreSQL",
    "MongoDB",
    "Elasticsearch",
    "Redis",
    "MySQL",
    "Prisma ORM",
  ],
};

const educationData = [
  {
    degree: "Master's — Enterprise Application Design & Development",
    school: "Babes-Bolyai University, Cluj-Napoca",
    period: "2019 — 2021",
  },
  {
    degree: "Bachelor's — Business & IT",
    school: "Babes-Bolyai University, Cluj-Napoca",
    period: "2016 — 2019",
  },
  {
    degree: "Micro-Degree — Blockchain Management",
    school: "Gritnova Global Campus",
    period: "2022 — 2023",
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <span>
      <span className="text-green">elod@varga</span>
      <span className="text-gray-light">:</span>
      <span className="text-blue">~</span>
      <span className="text-foreground">$ </span>
      <span className="text-amber">{children}</span>
    </span>
  );
}

function SectionHeader({ command }: { command: string }) {
  return (
    <div className="mb-4 select-none">
      <Prompt>{command}</Prompt>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="animate-fade-in space-y-4">
      <SectionHeader command="cat about.md" />
      <pre className="text-green text-sm leading-relaxed sm:text-base whitespace-pre-wrap">
        {`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   ELŐD VARGA                                      ║
  ║   CTO  //  Blockchain & AI  //  2x Exits          ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝`}
      </pre>

      <div className="space-y-3 pl-2 text-foreground">
        <p>
          Serial entrepreneur, founder, and CTO specializing in blockchain
          infrastructure and AI systems. Currently building cross-chain smart
          contract execution tooling at{" "}
          <span className="text-amber">Shinso</span>.
        </p>
        <p>
          Founded and exited two DeFi protocols (
          <span className="text-cyan">Lara Protocol</span> &{" "}
          <span className="text-cyan">taraSwap</span>) with combined{" "}
          <span className="text-green">$6M+ TVL</span>. EWOR Fellow building
          impact-driven companies. Angel investor via SunDAO Ventures and
          Transylvanian Angels Network.
        </p>
        <p>
          Driven by making complex technology accessible. Splits time between{" "}
          <span className="text-amber">Satu Mare</span> and{" "}
          <span className="text-amber">Dubai</span>. Plays basketball. Ships
          products.
        </p>

        <div className="mt-4 border-l-2 border-green-dark pl-3 text-gray-light italic">
          &quot;Committed to efficiency. Deeply passionate about education.
          Loves to simplify complex technologies for non-technical
          founders.&quot;
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 pl-2">
        {[
          "EWOR Fellow",
          "Angel Investor",
          "Speaker",
          "2x Founder Exit",
          "CTO",
        ].map((tag) => (
          <span
            key={tag}
            className="border border-green-dark px-2 py-0.5 text-xs text-green-dim"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExperienceSection() {
  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader command="cat experience.log" />
      <div className="space-y-6 pl-2">
        {experience.map((job, i) => (
          <div key={i} className="border-l border-green-dark pl-4">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-green font-bold">{job.role}</span>
              <span className="text-gray-light">@</span>
              <span className="text-amber">{job.company}</span>
              {job.note && (
                <span className="text-gray text-xs">({job.note})</span>
              )}
            </div>
            <div className="text-gray-light text-xs mt-0.5">
              {job.period} | {job.location}
            </div>
            <p className="text-foreground text-sm mt-2">{job.description}</p>
            <ul className="mt-2 space-y-1">
              {job.highlights.map((h, j) => (
                <li key={j} className="text-sm text-foreground">
                  <span className="text-green-dim mr-2">-&gt;</span>
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.tech.map((t) => (
                <span
                  key={t}
                  className="bg-surface-light px-1.5 py-0.5 text-xs text-cyan"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsSection() {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    active: "text-green",
    exited: "text-amber",
    shipped: "text-cyan",
  };

  const statusLabels: Record<string, string> = {
    active: "ACTIVE",
    exited: "EXITED",
    shipped: "SHIPPED",
  };

  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader command="ls -la projects/" />
      <div className="grid gap-4 pl-2 md:grid-cols-2">
        {projects.map((p) => (
          <div
            key={p.name}
            className="border border-border bg-surface p-4 hover:border-green-dark transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-green font-bold">{p.name}</span>
                <span
                  className={`ml-2 text-xs ${statusColors[p.status] || "text-gray"}`}
                >
                  [{statusLabels[p.status] || p.status}]
                </span>
              </div>
            </div>
            <div className="text-amber text-xs mt-0.5">{p.tagline}</div>
            <p className="text-foreground text-sm mt-2">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <span
                  key={t}
                  className="bg-surface-light px-1.5 py-0.5 text-xs text-cyan"
                >
                  {t}
                </span>
              ))}
            </div>
            {p.url && (
              <div className="mt-3 flex gap-3">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue hover:text-green transition-colors"
                >
                  [visit site]
                </a>
                <button
                  onClick={() =>
                    setExpandedProject(
                      expandedProject === p.name ? null : p.name
                    )
                  }
                  className="text-xs text-gray-light hover:text-green cursor-pointer transition-colors"
                >
                  {expandedProject === p.name
                    ? "[close preview]"
                    : "[preview]"}
                </button>
              </div>
            )}
            {expandedProject === p.name && p.url && (
              <div className="mt-3 border border-border overflow-hidden">
                <div className="bg-surface-light px-2 py-1 text-xs text-gray flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-red" />
                  <span className="inline-block h-2 w-2 rounded-full bg-amber" />
                  <span className="inline-block h-2 w-2 rounded-full bg-green" />
                  <span className="ml-2 text-gray-light">{p.url}</span>
                </div>
                <iframe
                  src={p.url}
                  title={p.name}
                  className="w-full h-64 bg-background border-0"
                  sandbox="allow-scripts allow-same-origin"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsSection() {
  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader command="cat skills.json" />
      <div className="pl-2">
        <div className="text-gray">{"{"}</div>
        {Object.entries(skills).map(([category, items], i) => (
          <div key={category} className="pl-4 mt-2">
            <span className="text-amber">&quot;{category}&quot;</span>
            <span className="text-foreground">: [</span>
            <div className="pl-4">
              {items.map((item, j) => (
                <div key={j}>
                  <span className="text-green-dim">&quot;{item}&quot;</span>
                  {j < items.length - 1 && (
                    <span className="text-gray">,</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-foreground">]</span>
            {i < Object.keys(skills).length - 1 && (
              <span className="text-gray">,</span>
            )}
          </div>
        ))}
        <div className="text-gray">{"}"}</div>
      </div>
    </div>
  );
}

function EducationSection() {
  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader command="cat education.txt" />
      <div className="space-y-4 pl-2">
        {educationData.map((e, i) => (
          <div key={i} className="border-l border-green-dark pl-4">
            <div className="text-green font-bold text-sm">{e.degree}</div>
            <div className="text-amber text-xs">{e.school}</div>
            <div className="text-gray text-xs">{e.period}</div>
          </div>
        ))}

        <div className="mt-4 border-l border-border pl-4">
          <div className="text-gray-light text-xs mb-2">
            // certifications & programs
          </div>
          {[
            "EWOR Fellowship — Berlin-based accelerator for \u20AC1B+ impact companies (2023\u2014Present)",
            "Blockchain Management Micro-Degree — Gritnova Global Campus",
            "Cambridge Advanced English (CAE)",
          ].map((cert, i) => (
            <div key={i} className="text-sm text-foreground">
              <span className="text-green-dim mr-2">+</span>
              {cert}
            </div>
          ))}
        </div>

        <div className="mt-4 border-l border-border pl-4">
          <div className="text-gray-light text-xs mb-2">// languages</div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span>
              <span className="text-amber">EN</span>{" "}
              <span className="text-gray">Full Professional</span>
            </span>
            <span>
              <span className="text-amber">HU</span>{" "}
              <span className="text-gray">Native</span>
            </span>
            <span>
              <span className="text-amber">RO</span>{" "}
              <span className="text-gray">Native</span>
            </span>
            <span>
              <span className="text-amber">ES</span>{" "}
              <span className="text-gray">Elementary</span>
            </span>
            <span>
              <span className="text-amber">DE</span>{" "}
              <span className="text-gray">Elementary</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Blog Section ────────────────────────────────────────────────────────────

interface Article {
  title: string;
  link: string;
  pubDate: string;
  categories: string[];
  description: string;
}

function BlogSection() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medium")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setArticles(data.articles || []);
        }
      })
      .catch(() => setError("Failed to fetch articles"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader command={`curl medium.com/@${MEDIUM_USERNAME} | parse`} />

      <div className="pl-2 mb-4">
        <a
          href={MEDIUM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue hover:text-green transition-colors text-xs"
        >
          [open full blog on Medium]
        </a>
      </div>

      {loading && (
        <div className="pl-2 space-y-1">
          <div className="text-green-dim">
            Fetching articles from Medium RSS feed...
          </div>
          <div className="text-gray-light cursor-blink" />
        </div>
      )}

      {error && (
        <div className="pl-2 space-y-2">
          <div className="text-red">
            Error: {error}
          </div>
          <div className="text-gray-light text-sm">
            Fallback: visit{" "}
            <a
              href={MEDIUM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue hover:text-green transition-colors"
            >
              {MEDIUM_URL}
            </a>
          </div>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="pl-2 text-gray-light">
          No articles found. Check the MEDIUM_USERNAME config or visit{" "}
          <a
            href={MEDIUM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue hover:text-green transition-colors"
          >
            {MEDIUM_URL}
          </a>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="space-y-4 pl-2">
          {articles.map((article, i) => (
            <div
              key={i}
              className="border border-border bg-surface p-4 hover:border-green-dark transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green font-bold hover:text-amber transition-colors"
                >
                  {article.title}
                </a>
                <span className="text-gray text-xs whitespace-nowrap">
                  {new Date(article.pubDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {article.description && (
                <p className="text-foreground text-sm mt-2 leading-relaxed">
                  {article.description}
                  {article.description.length >= 197 && "..."}
                </p>
              )}

              {article.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {article.categories.map((cat) => (
                    <span
                      key={cat}
                      className="bg-surface-light px-1.5 py-0.5 text-xs text-cyan"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue hover:text-green transition-colors"
                >
                  [read on Medium]
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contact Section ─────────────────────────────────────────────────────────

function ContactSection() {
  const links = [
    {
      label: "email",
      value: "elod@apeconsulting.xyz",
      href: "mailto:elod@apeconsulting.xyz",
    },
    {
      label: "linkedin",
      value: "linkedin.com/in/vargaelod",
      href: "https://linkedin.com/in/vargaelod",
    },
    { label: "web", value: "0xelod.com", href: "https://0xelod.com" },
    {
      label: "github",
      value: "github.com/Elod23",
      href: "https://github.com/Elod23",
    },
    {
      label: "medium",
      value: `medium.com/@${MEDIUM_USERNAME}`,
      href: MEDIUM_URL,
    },
    { label: "phone", value: "+407 5200 9620", href: "tel:+40752009620" },
  ];

  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader command="cat .contact" />
      <div className="pl-2 space-y-2">
        {links.map((link) => (
          <div key={link.label} className="flex gap-3 items-baseline">
            <span className="text-gray w-20 text-right text-xs">
              {link.label}
            </span>
            <span className="text-green-dim">=&gt;</span>
            <a
              href={link.href}
              target={
                link.href.startsWith("mailto:") ||
                link.href.startsWith("tel:")
                  ? undefined
                  : "_blank"
              }
              rel="noopener noreferrer"
              className="text-blue hover:text-green transition-colors text-sm"
            >
              {link.value}
            </a>
          </div>
        ))}
      </div>
      <div className="mt-6 border-l border-green-dark pl-4">
        <div className="text-gray-light text-xs mb-2">// also</div>
        <div className="text-sm text-foreground space-y-1">
          <div>
            <span className="text-green-dim mr-2">+</span>
            Angel Investor @{" "}
            <span className="text-amber">SunDAO Ventures</span>
          </div>
          <div>
            <span className="text-green-dim mr-2">+</span>
            Member @{" "}
            <span className="text-amber">Transylvanian Angels Network</span>
          </div>
          <div>
            <span className="text-green-dim mr-2">+</span>
            Fellow @ <span className="text-amber">EWOR</span>
          </div>
        </div>
      </div>
      <div className="mt-6 border-l border-border pl-4">
        <div className="text-gray-light text-xs mb-2">// actions</div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/Resume-Elod-Varga.pdf"
            download
            className="text-green text-xs border border-green px-3 py-1 hover:bg-green/10 transition-colors"
          >
            [ download CV ]
          </a>
          <a
            href="https://calendly.com/elod23/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber text-xs border border-amber px-3 py-1 hover:bg-amber/10 transition-colors"
          >
            [ book a call ]
          </a>
          <a
            href="https://adplist.org/mentors/elod-varga?session=29266-mentorship-session"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan text-xs border border-cyan px-3 py-1 hover:bg-cyan/10 transition-colors"
          >
            [ mentorship ]
          </a>
        </div>
      </div>

      <div className="mt-6 pl-2 text-gray-light text-xs">
        Based in Satu Mare, Romania & Dubai, UAE
      </div>
    </div>
  );
}

// ─── Help & Special Sections ─────────────────────────────────────────────────

function HelpSection() {
  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader command="help" />
      <div className="pl-2 space-y-4">
        <div>
          <div className="text-gray-light text-xs mb-2">
            // navigation commands
          </div>
          {NAV_COMMANDS.map((cmd) => {
            const descriptions: Record<string, string> = {
              about: "Who am I, what I do, where I'm based",
              experience: "Full career timeline with highlights",
              projects: "Notable projects with live previews",
              skills: "Technical skills as JSON",
              education: "Degrees, certifications, languages",
              blog: "Latest articles from Medium",
              contact: "Email, LinkedIn, GitHub, and more",
            };
            return (
              <div key={cmd} className="flex gap-3 items-baseline">
                <span className="text-green w-24">{cmd}</span>
                <span className="text-foreground text-sm">
                  {descriptions[cmd]}
                </span>
              </div>
            );
          })}
        </div>
        <div>
          <div className="text-gray-light text-xs mb-2">
            // utility commands
          </div>
          {[
            { cmd: "help", desc: "Show this help message" },
            { cmd: "clear", desc: "Clear screen, back to about" },
            { cmd: "whoami", desc: "Quick identity check" },
            { cmd: "history", desc: "Show command history" },
            { cmd: "neofetch", desc: "System info, hacker style" },
            { cmd: "pwd", desc: "Print working directory" },
            { cmd: "date", desc: "Current date" },
            { cmd: "uptime", desc: "Time since career start" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex gap-3 items-baseline">
              <span className="text-cyan w-24">{cmd}</span>
              <span className="text-foreground text-sm">{desc}</span>
            </div>
          ))}
        </div>
        <div className="text-gray text-xs mt-4">
          Tip: Use <span className="text-amber">Tab</span> to autocomplete,{" "}
          <span className="text-amber">Arrow Up/Down</span> to browse history
        </div>
      </div>
    </div>
  );
}

function NeofetchSection() {
  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader command="neofetch" />
      <div className="pl-2 flex flex-col sm:flex-row gap-6">
        <pre className="text-green text-xs leading-tight">
          {`
    ╔══════════╗
    ║  ┌────┐  ║
    ║  │ EV │  ║
    ║  └────┘  ║
    ║  ██████  ║
    ║ ████████ ║
    ║ ████████ ║
    ╚══════════╝`}
        </pre>
        <div className="text-sm space-y-1">
          <div>
            <span className="text-green font-bold">elod@varga</span>
          </div>
          <div className="text-green-dark">
            ────────────────────
          </div>
          <div>
            <span className="text-amber">OS</span>
            <span className="text-foreground">: blockchain_os 3.14.159</span>
          </div>
          <div>
            <span className="text-amber">Host</span>
            <span className="text-foreground">: Satu Mare / Dubai</span>
          </div>
          <div>
            <span className="text-amber">Kernel</span>
            <span className="text-foreground">: EVM-compatible v4.337</span>
          </div>
          <div>
            <span className="text-amber">Uptime</span>
            <span className="text-foreground">
              : {Math.floor((Date.now() - new Date("2019-05-01").getTime()) / (1000 * 60 * 60 * 24))} days (since first job)
            </span>
          </div>
          <div>
            <span className="text-amber">Shell</span>
            <span className="text-foreground">: TypeScript / Solidity / Python</span>
          </div>
          <div>
            <span className="text-amber">Resolution</span>
            <span className="text-foreground">: 2x exits @ $6M+ TVL</span>
          </div>
          <div>
            <span className="text-amber">DE</span>
            <span className="text-foreground">: VSCode + Neovim</span>
          </div>
          <div>
            <span className="text-amber">CPU</span>
            <span className="text-foreground">: MoE-powered Shinsō engine</span>
          </div>
          <div>
            <span className="text-amber">Memory</span>
            <span className="text-foreground">: 7+ years of shipping</span>
          </div>
          <div className="mt-2 flex gap-1">
            {["bg-red", "bg-amber", "bg-green", "bg-cyan", "bg-blue", "bg-purple"].map((c) => (
              <span key={c} className={`inline-block h-3 w-3 ${c}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Registry ────────────────────────────────────────────────────────

const NAV_SECTIONS: Record<NavCommand, () => React.JSX.Element> = {
  about: AboutSection,
  experience: ExperienceSection,
  projects: ProjectsSection,
  skills: SkillsSection,
  education: EducationSection,
  blog: BlogSection,
  contact: ContactSection,
};

// ─── Main ────────────────────────────────────────────────────────────────────

type SectionView = NavCommand | "help" | "neofetch";

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionView>("about");
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [winking, setWinking] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const prevSection = useRef<SectionView>(activeSection);

  // Wink when switching sections
  useEffect(() => {
    if (prevSection.current !== activeSection && booted) {
      setWinking(true);
      const t = setTimeout(() => setWinking(false), 400);
      prevSection.current = activeSection;
      return () => clearTimeout(t);
    }
  }, [activeSection, booted]);

  const boot = [
    "BIOS v3.14.159 — blockchain_os kernel loading...",
    "Initializing neural pathways.............. OK",
    "Loading DeFi modules.................... OK",
    "Mounting cross-chain bridges............. OK",
    "Compiling smart contracts................ OK",
    "Starting AI reasoning engine............. OK",
    "",
    "System ready. Type 'help' for available commands.",
    "",
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < boot.length) {
        setBootLines((prev) => [...prev, boot[i]]);
        i++;
      } else {
        clearInterval(interval);
        setBooted(true);
      }
    }, 120);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  const showFeedback = useCallback((msg: string) => {
    setCmdFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setCmdFeedback(null), 4000);
  }, []);

  const handleCommand = useCallback(
    (raw: string) => {
      const cmd = raw.trim().toLowerCase();
      if (!cmd) return;

      setCmdHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);
      setInputValue("");

      // Nav commands
      if (NAV_COMMANDS.includes(cmd as NavCommand)) {
        setActiveSection(cmd as NavCommand);
        setCmdFeedback(null);
        return;
      }

      // Aliases
      if (cmd === "whoami") {
        setActiveSection("about");
        showFeedback("// you are Előd Varga. Obviously.");
        return;
      }

      // Utility commands
      if (cmd === "help") {
        setActiveSection("help");
        setCmdFeedback(null);
        return;
      }

      if (cmd === "clear" || cmd === "cls") {
        setActiveSection("about");
        setCmdFeedback(null);
        return;
      }

      if (cmd === "neofetch") {
        setActiveSection("neofetch");
        setCmdFeedback(null);
        return;
      }

      if (cmd === "history") {
        showFeedback(
          cmdHistory.length === 0
            ? "// no history yet"
            : cmdHistory.map((c, i) => `  ${i + 1}  ${c}`).join("\n")
        );
        return;
      }

      if (cmd === "pwd") {
        showFeedback("/home/elod/portfolio");
        return;
      }

      if (cmd === "date") {
        showFeedback(new Date().toString());
        return;
      }

      if (cmd === "uptime") {
        const days = Math.floor(
          (Date.now() - new Date("2019-05-01").getTime()) /
            (1000 * 60 * 60 * 24)
        );
        showFeedback(
          `up ${days} days — shipping since May 2019`
        );
        return;
      }

      if (cmd === "ls") {
        showFeedback(
          "about.md  experience.log  projects/  skills.json  education.txt  blog/  .contact"
        );
        return;
      }

      // Easter eggs
      if (cmd.startsWith("sudo")) {
        showFeedback(
          "// nice try. This incident will be reported."
        );
        return;
      }

      if (cmd.startsWith("rm ")) {
        showFeedback(
          "// permission denied. You can't delete my achievements."
        );
        return;
      }

      if (cmd === "exit" || cmd === "quit") {
        showFeedback("// there is no escape. Try 'help' instead.");
        return;
      }

      if (cmd === "vim" || cmd === "nano" || cmd === "emacs") {
        showFeedback(
          `// ${cmd}? bold choice. But this is a read-only filesystem.`
        );
        return;
      }

      if (cmd === "hire" || cmd === "hire me") {
        setActiveSection("contact");
        showFeedback("// great decision. Here's how to reach me.");
        return;
      }

      if (cmd === "ping") {
        showFeedback(
          "PING elod@varga: 64 bytes — reply: I'm available for interesting projects"
        );
        return;
      }

      // Unknown command
      showFeedback(
        `bash: ${cmd}: command not found. Type 'help' for available commands.`
      );
    },
    [cmdHistory, showFeedback]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(inputValue);
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const partial = inputValue.toLowerCase();
      if (partial) {
        const match = ALL_COMMANDS.find((c) => c.startsWith(partial));
        if (match) setInputValue(match);
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? cmdHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInputValue(cmdHistory[newIndex]);
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= cmdHistory.length) {
          setHistoryIndex(-1);
          setInputValue("");
        } else {
          setHistoryIndex(newIndex);
          setInputValue(cmdHistory[newIndex]);
        }
      }
    }

    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setActiveSection("about");
      setCmdFeedback(null);
    }
  };

  // Determine what to render
  const renderContent = () => {
    if (activeSection === "help") return <HelpSection />;
    if (activeSection === "neofetch") return <NeofetchSection />;
    const Component = NAV_SECTIONS[activeSection as NavCommand];
    return Component ? <Component /> : null;
  };

  return (
    <div className="scanline flex min-h-screen items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-7xl border border-border bg-surface shadow-2xl shadow-green/5 sm:rounded-lg overflow-hidden">
        {/* ── Title Bar ────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-light px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red" />
          <span className="h-3 w-3 rounded-full bg-amber" />
          <span className="h-3 w-3 rounded-full bg-green" />
          <span className="ml-3 text-xs text-gray-light flex-1 text-center">
            elod@varga: ~/portfolio
          </span>
        </div>

        {/* ── Terminal Body ────────────────────────────────── */}
        <div
          className="flex flex-col"
          style={{ height: "calc(100vh - 6rem)", minHeight: "500px" }}
        >
          {/* ── Boot Sequence ─────────────────────────────── */}
          {!booted && (
            <div className="p-4 sm:p-6 text-sm text-green-dim overflow-hidden flex-1">
              {bootLines.map((line, i) => (
                <div key={i} className={line === "" ? "h-4" : ""}>
                  {line}
                </div>
              ))}
              <span className="cursor-blink" />
            </div>
          )}

          {booted && (
            <>
              {/* ── Nav Bar ──────────────────────────────── */}
              <div className="border-b border-border px-4 py-2 sm:px-6 flex flex-wrap gap-1 items-center">
                <span className="text-gray text-xs mr-2 hidden sm:inline">
                  ~/
                </span>
                {NAV_COMMANDS.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setActiveSection(cmd);
                      setCmdFeedback(null);
                      inputRef.current?.focus();
                    }}
                    className={`cursor-pointer px-2.5 py-1 text-xs transition-all border ${
                      activeSection === cmd
                        ? "border-green text-green bg-green/5"
                        : "border-transparent text-gray-light hover:text-green hover:border-green-dark"
                    }`}
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {/* ── Content + Photo ─────────────────────── */}
              <div className="flex flex-1 overflow-hidden">
                {/* ── Content ────────────────────────────── */}
                <div
                  ref={contentRef}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm"
                >
                  {renderContent()}
                </div>

                {/* ── Profile Photo Sidebar ───────────────── */}
                <div className="hidden lg:flex w-56 xl:w-64 shrink-0 border-l border-border bg-surface-light items-center justify-center p-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative overflow-hidden rounded-sm border border-green-dark">
                      <Image
                        src="/profilepic.jpeg"
                        alt="Előd Varga"
                        width={200}
                        height={200}
                        className={`object-cover grayscale hover:grayscale-0 transition-all duration-500 ${winking ? "wink" : ""}`}
                        priority
                      />
                      <div className="absolute inset-0 border border-green/10 pointer-events-none" />
                    </div>
                    <div className="text-center">
                      <div className="text-green text-xs font-bold">Előd Varga</div>
                      <div className="text-gray text-[10px] mt-0.5">CTO @ Shinso</div>
                      <div className="text-gray text-[10px]">Satu Mare / Dubai</div>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full mt-1">
                      <a
                        href="/Resume-Elod-Varga.pdf"
                        download
                        className="block text-center border border-green text-green text-[10px] px-2 py-1.5 hover:bg-green/10 transition-colors"
                      >
                        [ download CV ]
                      </a>
                      <a
                        href="https://calendly.com/elod23/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center border border-amber text-amber text-[10px] px-2 py-1.5 hover:bg-amber/10 transition-colors"
                      >
                        [ book a call &nbsp;<span className="text-gray text-[10px]">for Advisory</span> ] 
                      </a>
                      <a
                        href="https://adplist.org/mentors/elod-varga?session=29266-mentorship-session"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center border border-cyan text-cyan text-[10px] px-2 py-1.5 hover:bg-cyan/10 transition-colors"
                      >
                        [ mentorship ]
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Command Feedback ──────────────────────── */}
              {cmdFeedback && (
                <div className="border-t border-border px-4 py-2 sm:px-6 bg-surface text-xs whitespace-pre-wrap">
                  <span className="text-gray-light">{cmdFeedback}</span>
                </div>
              )}

              {/* ── Input Prompt ──────────────────────────── */}
              <div className="border-t border-border px-4 py-3 sm:px-6 flex items-center gap-2 bg-surface-light">
                <Prompt>
                  <span />
                </Prompt>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="type a command... (try 'help')"
                  className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-gray caret-green"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
