import { CitationEntry, ResearchDocument } from '../types';

export const SAMPLE_DOCUMENTS: ResearchDocument[] = [
  {
    id: 'sample_quantum_2024',
    fingerprint: 'sample_quantum_2024_hash',
    title: 'Non-Locality and Fault-Tolerant Entanglement in Distributed Quantum Computing',
    authors: ['Elena Rostova', 'Marcus Vance', 'Liam K. Thorne'],
    publicationYear: '2024',
    publicationDate: 'March 2024',
    sourceOrPublisher: 'American Physical Society',
    journalOrBookTitle: 'Physical Review Letters',
    volume: '132',
    issue: '4',
    instituteOrOrg: 'Oxford Quantum Institute & MIT Center for Theoretical Physics',
    doi: '10.1103/PhysRevLett.132.040601',
    arxivId: '2403.09112',
    fileType: 'pdf',
    fileName: 'Rostova_et_al_Quantum_Entanglement_2024.pdf',
    fileSize: 428000,
    abstract: 'We present a rigorous topological framework for establishing high-fidelity non-local entanglement across distributed quantum nodes subject to stochastic Pauli noise channels.',
    pages: [
      {
        pageNumber: 1,
        chapterTitle: '1. Introduction and Foundations of Entanglement',
        text: `PHYSICAL REVIEW LETTERS — MARCH 2024
DOI: 10.1103/PhysRevLett.132.040601

NON-LOCALITY AND FAULT-TOLERANT ENTANGLEMENT IN DISTRIBUTED QUANTUM COMPUTING
Elena Rostova, Marcus Vance, and Liam K. Thorne
Oxford Quantum Institute & MIT Center for Theoretical Physics

ABSTRACT
We present a rigorous topological framework for establishing high-fidelity non-local entanglement across distributed quantum nodes subject to stochastic Pauli noise channels. By constructing dynamic surface-code repeaters with continuous projective syndrome measurements, we demonstrate an asymptotic suppression of decoherence below threshold ϵ_c ≈ 1.24%.

1. INTRODUCTION & THE PROBLEM OF DISTRIBUTED COHERENCE
The scalability of monolithic quantum computing architectures remains fundamentally constrained by spatial thermal loads and microwave crosstalk. Distributed quantum processing offers an escape from physical chip footprint limits by interconnecting modular ion traps or superconducting cryostats via optical fiber channels.

However, distributing quantum information across macroscopic physical distances introduces profound fidelity degradation. As John Stewart Bell (1964, p. 195) originally established in his foundational critique of hidden variables: "In a theory in which parameters are added to quantum mechanics to determine the results of individual measurements, without changing the statistical predictions, there must be a mechanism whereby the setting of one measurement device can influence the reading of another instrument, however remote."

In this article, we extend Bell's non-local invariants to fault-tolerant cluster states. We demonstrate that non-locality is not merely an epistemological curiosity, but an operational resource for macroscopic error correction across asynchronous distributed hardware.`,
      },
      {
        pageNumber: 2,
        chapterTitle: '2. Surface Code Repeaters & Teleportation Protocols',
        text: `2. SURFACE CODE REPEATERS & TELEPORTATION PROTOCOLS

To preserve coherence across photon interconnects, we deploy a modified rotated surface code lattice on each node. Let |Ψ⟩_AB denote the maximally entangled Bell pair (|00⟩ + |11⟩)/√2 shared between Node A and Node B. When transmission loss occurs with probability η_loss, standard direct transmission yields an exponential fidelity decay F(L) = F_0 e^(-L/L_0).

To overcome this attenuation, quantum teleportation is orchestrated via intermediate relay nodes. Following the landmark formulation by Bennett et al. (1993, p. 1896): "An unknown quantum state can be dismantled into classical information and purely non-local Einstein-Podolsky-Rosen (EPR) correlations, and subsequently reconstructed at an arbitrary distance without violating the uncertainty principle."

Figure 2 illustrates the time-resolved syndrome extraction cycle. Each relay node performs a joint Bell-state measurement (BSM) on incoming photonic qubits, broadcasting a 2-bit classical correction signal to terminal endpoints. Our simulation indicates that feed-forward correction latencies under 120 ns achieve an operational threshold well within modern FPGA routing constraints.`,
      },
      {
        pageNumber: 3,
        chapterTitle: '3. Error Thresholds and Asymptotic Scaling',
        text: `3. ERROR THRESHOLDS AND ASYMPTOTIC SCALING

The key metric of practical viability is the fault-tolerance threshold under realistic depolarizing noise. We model gate errors as independent and identically distributed (i.i.d.) Kraus operators with error rate p_g ∈ [10^(-4), 10^(-2)].

As famously conjectured by Richard Feynman (1982, p. 468) during his visionary lecture on simulating physics with computers: "Nature isn't classical, dammit, and if you want to make a simulation of nature, you'd better make it quantum mechanical, and by golly it's a wonderful problem, because it doesn't look so easy."

Our numerical Monte Carlo results confirm this difficulty yet reveal a promising plateau: for physical error rates p_g < 0.85%, logical qubit error rates decrease super-exponentially with code distance d. For a distance d = 9 surface code patch across 16 interconnected cryogenic nodes, the expected logical mean time between failures (MTBF) exceeds 48 hours of continuous quantum Fourier transform execution.`,
      },
      {
        pageNumber: 4,
        chapterTitle: '4. Discussion & Conclusions',
        text: `4. DISCUSSION & CONCLUDING PERSPECTIVES

We have established a mathematically consistent and experimentally tractable architecture for modular quantum computing. By decoupling memory nodes from communication channels through dynamic purification, the system exhibits resilience against both fiber photon loss and qubit dephasing.

Future work will examine the integration of hyper-entangled photonic states to double channel capacity without requiring cryogenic optical switching fabrics.

ACKNOWLEDGEMENTS
This research was supported by the European Research Council (ERC Grant No. 892110) and the National Science Foundation (NSF Center for Quantum Networks, Award DMR-1920834).

REFERENCES
[1] Bell, J. S. (1964). On the Einstein Podolsky Rosen Paradox. Physics Physique Fizika, 1(3), 195-200.
[2] Bennett, C. H., Brassard, G., Crépeau, C., Jozsa, R., Peres, A., & Wootters, W. K. (1993). Teleporting an unknown quantum state via dual classical and Einstein-Podolsky-Rosen channels. Physical Review Letters, 70(13), 1895-1899.
[3] Feynman, R. P. (1982). Simulating physics with computers. International Journal of Theoretical Physics, 21(6), 467-488.`,
      },
    ],
  },
  {
    id: 'sample_sociology_2023',
    fingerprint: 'sample_sociology_2023_hash',
    title: 'The Algorithmic Commons: Platform Labor and the Enclosure of Digital Cooperation',
    authors: ['Priya Nair', 'Samuel O. Chen'],
    publicationYear: '2023',
    publicationDate: 'November 2023',
    sourceOrPublisher: 'Taylor & Francis',
    journalOrBookTitle: 'Journal of Digital Sociology & Political Economy',
    volume: '28',
    issue: '2',
    instituteOrOrg: 'Center for the Study of Platform Work, University of Cambridge',
    doi: '10.1080/14742837.2023.2189045',
    fileType: 'html',
    fileName: 'Nair_Chen_Algorithmic_Commons_2023.html',
    fileSize: 310000,
    abstract: 'This paper examines the transformation of cooperative labor under algorithmic dispatch management and gig-economy platforms.',
    pages: [
      {
        pageNumber: 1,
        chapterTitle: '1. The Ideology of Flexibility',
        text: `JOURNAL OF DIGITAL SOCIOLOGY & POLITICAL ECONOMY — VOL. 28, NO. 2
DOI: 10.1080/14742837.2023.2189045

THE ALGORITHMIC COMMONS: PLATFORM LABOR AND THE ENCLOSURE OF DIGITAL COOPERATION
Priya Nair and Samuel O. Chen
Center for the Study of Platform Work, University of Cambridge

1. THE IDEOLOGY OF FLEXIBILITY AND DIGITAL WORK
Over the past decade, on-demand labor platforms have framed their services through the rhetoric of entrepreneurship, scheduling autonomy, and frictionless micro-work. Workers are designated as 'independent contractors', theoretically free to choose their working hours, accept or reject assignments, and leverage decentralized digital infrastructure.

However, qualitative field interviews and telemetry data reveal a starkly different reality. Beneath the veneer of flexibility lies an asymmetrical architecture of pervasive algorithmic surveillance and predictive discipline.

As Shoshana Zuboff (2019, p. 112) famously observed in her critique of behavioral modification: "Surveillance capitalism unilaterally claims human experience as free raw material for translation into behavioral data. Some of these data are applied to product or service improvement, but the rest are declared as a proprietary behavioral surplus, fed into advanced manufacturing processes known as 'machine intelligence'."

In the context of gig work, this behavioral surplus is weaponized to dictate dispatch priorities, suppress collective bargaining, and enforce dynamic wage discrimination without human managerial mediation.`,
      },
      {
        pageNumber: 2,
        chapterTitle: '2. Enclosure and Algorithmic Discipline',
        text: `2. THE HISTORICAL PARALLEL: NEW ENCLOSURES OF COOPERATIVE SPACE

The structural dynamics of modern digital platforms closely parallel the historical enclosure movements of early agrarian capitalism. Just as common land was systematically privatized and fenced to compel wage labor, the communicative and spatial commons of urban workers are now enclosed within proprietary software ecosystems.

According to David Harvey (2003, p. 145), capital accumulation repeatedly relies on "accumulation by dispossession"—the continuous privatization of public assets and cooperative social wealth to maintain profit margins during crises of over-accumulation.

On ride-hail and courier platforms, drivers frequently create informal mutual-aid WhatsApp networks, coordinate off-platform rest areas, and share tips on navigating opaque dispatch algorithms. Yet platform operators actively neutralize these collective spaces through gamification, individualized surge pricing, and sudden account deactivations (shadow-banning).

The algorithm functions not merely as a dispatcher, but as an opaque tribunal that privatizes the social cooperation of workers while externalizing all operational risk and equipment depreciation onto individuals.`,
      },
      {
        pageNumber: 3,
        chapterTitle: '3. Collective Resistance and Data Cooperativism',
        text: `3. TOWARD A DEMOCRATIC COMMONS: DATA COOPERATIVES AND PLATFORM SOLIDARITY

In response to algorithmic enclosure, emerging worker coalitions are pioneering counter-infrastructures. Across Bologna, London, and San Francisco, delivery worker unions have developed open-source dispatch tools and worker-governed data trusts.

As Nick Srnicek (2017, p. 88) contends in his seminal study of platform capitalism: "If we are to resist the monopolistic trajectory of platform giants, we must treat digital platforms as public utilities—democratically owned, transparent in their algorithmic rules, and subordinate to the collective welfare of users and producers alike."

Our case studies demonstrate that when courier collectives regain governance over their location telemetry and rating history, average take-home compensation increases by 22% while stress indices related to rating anxiety plummet. The future of labor depends not on dismantling technology, but on reclaiming the computational commons for collective human flourishing.`,
      },
    ],
  },
  {
    id: 'sample_philosophy_2021',
    fingerprint: 'sample_philosophy_2021_hash',
    title: 'The Architecture of Rationality: Epistemological Transitions & Paradigm Shifts',
    authors: ['Arthur Sterling'],
    publicationYear: '2021',
    publicationDate: '2021',
    sourceOrPublisher: 'Oxford University Press',
    journalOrBookTitle: 'The Architecture of Rationality',
    chapterName: 'Chapter 4: The Incommensurability of Competing Worldviews',
    instituteOrOrg: 'Faculty of Philosophy, University of Oxford',
    isbn: '978-0-19-883492-1',
    fileType: 'md',
    fileName: 'Sterling_Architecture_of_Rationality_Ch4.md',
    fileSize: 280000,
    abstract: 'An investigation into conceptual change, anomaly accumulation, and revolutionary shifts in scientific epistemology.',
    pages: [
      {
        pageNumber: 1,
        chapterTitle: 'Chapter 4: The Incommensurability of Competing Worldviews',
        text: `# THE ARCHITECTURE OF RATIONALITY
## Chapter 4: The Incommensurability of Competing Worldviews
By Arthur Sterling • Oxford University Press (2021)
ISBN: 978-0-19-883492-1

### 1. Cumulative Progress vs. Structural Rupture
The standard enlightenment narrative of scientific advancement portrays knowledge as a steady, cumulative pyramid. Each generation of researchers is envisioned as adding empirical bricks upon foundations laid down by their predecessors, gradually dispelling ignorance through systematic observation and deductive logic.

Yet historical scrutiny reveals that major conceptual transitions rarely occur through gentle accumulation. Instead, they resemble cognitive revolutions that fundamentally redefine the terms, instruments, and metaphysical criteria of valid science.

As Thomas S. Kuhn (1962, p. 111) famously argued in *The Structure of Scientific Revolutions*: "When paradigms change, the world itself changes with them. Led by a new paradigm, scientists adopt new instruments and look in new places. Even more important, during revolutions scientists see new and different things when looking with familiar instruments in places they have looked before."

This perceptual re-orientation implies that competing scientific frameworks cannot be easily translated into one another without conceptual loss.`,
      },
      {
        pageNumber: 2,
        chapterTitle: '2. Anomaly Accumulation and Falsification',
        text: `### 2. The Accumulation of Anomalies and the Limits of Falsification

How does a reigning paradigm begin to fracture? In normal science, discordant empirical findings are initially treated as experimental errors or minor puzzles to be resolved by adjusting auxiliary hypotheses.

Karl Popper (1959, p. 41) proposed falsificationism as the demarcation criterion of genuine science: "A system is to be considered scientific only if it makes assertions which may clash with observations; and a system is, in fact, tested by attempts to produce such clashes, that is to say by attempts to falsify it."

However, in actual historical practice, researchers rarely abandon a comprehensive explanatory framework merely because an isolated anomaly surfaces. As Imre Lakatos later demonstrated, scientists protect the hard core of their research programs by deploying a protective belt of auxiliary assumptions.

Only when anomalies accumulate to the point of theoretical paralysis—and critically, only when a viable alternative paradigm presents itself—does the scientific community undergo a structural shift in allegiance.`,
      },
      {
        pageNumber: 3,
        chapterTitle: '3. Francis Bacon and the Idols of the Mind',
        text: `### 3. Epistemic Humility and the Idols of Understanding

The challenge of escaping entrenched conceptual frameworks was recognized at the dawn of early modern scientific philosophy. In the *Novum Organum*, Francis Bacon (1620, Aphorism 39) warned against the deceptive cognitive traps that impede objective inquiry:

"There are four classes of Idols which beset men's minds. To these for distinction's sake I have assigned names: let the first class be called Idols of the Tribe; the second, Idols of the Cave; the third, Idols of the Marketplace; and the fourth, Idols of the Theater."

Bacon understood that the human intellect is not a clean dry mirror, but an uneven prism that reflects its own preconceptions onto nature. Recognizing the incommensurability of worldviews does not require descending into radical relativism; rather, it demands the highest standard of epistemological vigilance and methodological self-reflection.`,
      },
    ],
  },
];

/**
 * Seed initial sample citations for Quantum paper so user immediately sees how it works
 */
export const SAMPLE_INITIAL_CITATIONS: CitationEntry[] = [
  {
    id: 'cite_init_1',
    docFingerprint: 'sample_quantum_2024_hash',
    docTitle: 'Non-Locality and Fault-Tolerant Entanglement in Distributed Quantum Computing',
    quoteText: 'In a theory in which parameters are added to quantum mechanics to determine the results of individual measurements, without changing the statistical predictions, there must be a mechanism whereby the setting of one measurement device can influence the reading of another instrument, however remote.',
    pageNumber: 1,
    pageNumberDisplay: 'p. 1',
    chapterName: '1. Introduction and Foundations of Entanglement',
    authors: ['Elena Rostova', 'Marcus Vance', 'Liam K. Thorne'],
    publicationYear: '2024',
    publicationDate: 'March 2024',
    sourceOrPublisher: 'American Physical Society',
    journalOrBookTitle: 'Physical Review Letters',
    volume: '132',
    issue: '4',
    instituteOrOrg: 'Oxford Quantum Institute & MIT Center for Theoretical Physics',
    doi: '10.1103/PhysRevLett.132.040601',
    contextBefore: 'As John Stewart Bell (1964, p. 195) originally established in his foundational critique of hidden variables: ',
    contextAfter: ' In this article, we extend Bell\'s non-local invariants to fault-tolerant cluster states.',
    thirdPartyAttribution: {
      isThirdPartyQuote: true,
      detectedAuthor: 'John Stewart Bell',
      detectedYear: '1964',
      originalWorkTitle: 'On the Einstein Podolsky Rosen Paradox',
      citingPhrase: 'As John Stewart Bell (1964, p. 195) originally established',
    },
    tags: ['Bell-Theorem', 'Non-Locality', 'Foundations'],
    userNote: 'Crucial historical context connecting Bell non-locality to distributed surface codes.',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'cite_init_2',
    docFingerprint: 'sample_quantum_2024_hash',
    docTitle: 'Non-Locality and Fault-Tolerant Entanglement in Distributed Quantum Computing',
    quoteText: 'Nature isn\'t classical, dammit, and if you want to make a simulation of nature, you\'d better make it quantum mechanical, and by golly it\'s a wonderful problem, because it doesn\'t look so easy.',
    pageNumber: 3,
    pageNumberDisplay: 'p. 3',
    chapterName: '3. Error Thresholds and Asymptotic Scaling',
    authors: ['Elena Rostova', 'Marcus Vance', 'Liam K. Thorne'],
    publicationYear: '2024',
    publicationDate: 'March 2024',
    sourceOrPublisher: 'American Physical Society',
    journalOrBookTitle: 'Physical Review Letters',
    volume: '132',
    issue: '4',
    instituteOrOrg: 'Oxford Quantum Institute & MIT Center for Theoretical Physics',
    doi: '10.1103/PhysRevLett.132.040601',
    contextBefore: 'As famously conjectured by Richard Feynman (1982, p. 468) during his visionary lecture on simulating physics with computers: ',
    contextAfter: ' Our numerical Monte Carlo results confirm this difficulty...',
    thirdPartyAttribution: {
      isThirdPartyQuote: true,
      detectedAuthor: 'Richard Feynman',
      detectedYear: '1982',
      originalWorkTitle: 'Simulating physics with computers',
      citingPhrase: 'As famously conjectured by Richard Feynman (1982, p. 468)',
    },
    tags: ['Feynman', 'Quantum-Simulation', 'History-of-Physics'],
    userNote: 'Foundational motivation for quantum computational complexity.',
    createdAt: Date.now() - 1800000,
  },
];
