
# Product Requirements Document (PRD)
## Project: MolNuSim (SimChem)

### 1. Executive Summary
**SimChem** is a production-grade, browser-based physics simulator designed to visualize the bridge between Molecular Chemistry and Nuclear Physics. Unlike static molecular editors, SimChem provides a continuous, real-time environment where atoms are subject to rigorous physical forces, chemical bonding rules, and probabilistic nuclear decay. It serves as an educational sandbox allowing users to observe femtosecond-scale molecular vibrations alongside billion-year-scale radioactive decay chains.

### 2. Core User Experience Goals
1.  **Scientific Fidelity:** The simulation must adhere to VSEPR geometry, Valency rules, and IUPAC element data.
2.  **Hybrid Time-Scaling:** Users must be able to observe immediate chemical reactions (real-time) and long-term nuclear decay (accelerated time) within the same session.
3.  **Adaptive Interaction:** The interface must provide distinct, optimized control schemes for both Mouse/Keyboard (Desktop) and Touch (Mobile/Tablet) inputs.
4.  **Tactile Physics:** Interactions (dragging, throwing) must feel responsive and weighty. Momentum must be conserved when users release atoms.
5.  **3D Spatial Awareness:** Users must be able to manipulate molecules in full 3D space, rotating them to inspect complex geometries (e.g., rings, tetrahedrons) without visual clipping or flattening artifacts.

---

### 3. Simulation Requirements (The Physics Engine)

The core simulation loop runs independently of the UI thread, utilizing a **Force Accumulation** architecture integrated via Semi-Implicit (Symplectic) Euler. This ensures long-term stability, conservation of momentum, and prevents "ghost forces" that cause stationary molecules to drift or spin.

#### 3.1. Physics Pipeline
The update loop executes the following stages per sub-step:
1.  **Clear Forces**: Reset force accumulators ($F_x, F_y, F_z$) for all atoms to zero.
2.  **Continuous Forces (Accumulation)**:
    *   **VSEPR**: Calculates angular restoration forces to enforce geometry (Linear, Trigonal, Tetrahedral).
    *   **Electrostatics**: Coulomb forces ($F = k \frac{q_1 q_2}{r^2}$) applied symmetrically to charged particles.
    *   **Pauli Repulsion**: Short-range penalty forces preventing atom overlap.
    *   **Covalent Bonds**: Spring-damper systems ($F = -kx - cv$) modeling bond vibration.
    *   **Z-Plane Restoration**: A very weak centering force ($k \approx 0.001$) acts on the Z-axis to gently encourage atoms to stay near the focal plane without crushing 3D structures into 2D.
3.  **Discrete Events (Annealing & Reactions)**:
    *   **Reactions**: High-energy collisions triggering bond formation or breaking.
    *   **Annealing**: Topology corrections (e.g., shedding excess bonds) apply discrete velocity impulses ensuring Center of Mass stability.
4.  **Integration**:
    *   Update Velocity: $V_{new} = V_{old} + (F_{acc} / m) \cdot \Delta t$
    *   **Thermal Stabilization (Cooldown):** Newly synthesized atoms utilize a temporary "Shock Absorber" drag coefficient (decaying over ~0.5s) to damp high-energy forces from teleportation/layout snapping.
    *   Update Position: $P_{new} = P_{old} + V_{new} \cdot \Delta t$
    *   **Spatial Boundaries**: Atoms are strictly clamped within X/Y bounds. Z-axis bounds are extended significantly ($\pm 10,000u$) to allow large macromolecules to rotate freely without clipping.

#### 3.2. Molecular Geometry (VSEPR Implementation)
To prevent "floppy" molecules, the engine enforces angular constraints based on Valence Shell Electron Pair Repulsion theory.
*   **Scope:** Applied to covalent non-metals (Groups 13-18 + H).
*   **Domain Calculation:** Geometry is determined by steric number (Bonds + Lone Pairs).
*   **Force Application:**
    *   Calculates the dot product (cosine) between adjacent bond vectors.
    *   Compares against ideal angles (e.g., 109.5° for Tetrahedral).
    *   Applies orthogonal restoration forces to push atoms toward the ideal angle.
*   **Geometries Enforced:**
    *   **Linear:** 2 Domains (180°), e.g., $CO_2$.
    *   **Trigonal Planar:** 3 Domains (120°), e.g., $BF_3$.
    *   **Tetrahedral:** 4 Domains (109.5° projected to 2D/3D), e.g., $CH_4$.
    *   **Bent:** 3 Domains (<120°) or 4 Domains (<109.5°), e.g., $H_2O$.

#### 3.3. Chemistry Engine (Reactions & Annealing)
The engine acts as a "Heuristic Chemist," actively correcting user input and facilitating reactions.
*   **Bonding Rules:**
    *   **Bond Order:** Supports Single, Double, and Triple bonds based on electron sharing.
    *   **Elastic Limit:** Bonds snap if stretched beyond **5x** the rest length.
*   **Annealing (Error Correction):** The system automatically optimizes structures:
    *   **Smart Shedding:** If an atom exceeds its valency, it ejects the least structurally significant bond. The ejection force is balanced to prevent the parent molecule from recoiling wildly.
    *   **Homonuclear Cleanup:** Atoms bonded to their own type (e.g., $O-O$) will preferentially migrate to a nearby "Better Hub" (e.g., $C$) if available.
*   **Molecular Synthesis (The "Super Crunch"):**
    *   **Gravity Well:** Atoms pulled into a high-density zone (via Lasso or Recipe Spawn) are compressed.
    *   **Speed:** The assembly process is tuned to **1.5 seconds (90 frames)** for snappy responsiveness.
    *   **Graph Layout:** Before physics takes over, the engine solves a mini-simulation to determine valid topological positions, reducing explosive overlap.

#### 3.4. Nuclear Physics (Decay)
*   **Data Source:** Each atom tracks its specific isotope (Mass, Half-Life, Decay Mode).
*   **Probabilistic Model:** Decay occurs based on $P = 1 - 2^{-\Delta t / HL}$.
*   **Dynamic Hydrogen Radius:** The physics engine enforces a visual distinction for Hydrogen (Z=1):
    *   **Bare Proton ($^1H^+$):** Defined as Mass < 1.6 AND Charge $\ge$ +1. Rendered with a small radius ($r=20$).
    *   **Deuteron/Triton/Neutral H:** If the mass increases (Neutron Capture) or charge neutralizes (Electron Capture), the atom "puffs up" to standard atomic radius ($r \approx 40$) to represent the formation of a complex nucleus or electron cloud.
*   **Decay Modes:**
    *   **Alpha:** Emission of He-4 nucleus ($Z \rightarrow Z-2$). High recoil.
    *   **Beta:** Neutron-to-Proton conversion ($Z \rightarrow Z+1$). Low recoil.
    *   **Spontaneous Fission:** Atom splits or vanishes (simplified).
    *   **Neutron Capture:** Free neutrons can strike atoms to increase isotope mass ($A \rightarrow A+1$), potentially creating unstable isotopes.

---

### 4. Interface & Interaction Requirements

#### 4.1. Input Paradigms
*   **Desktop (Mouse):**
    *   **Drag & Drop:** Physical drag with spring constraints.
    *   **Scroll Rotation (Tumbling):** Scrolling the mouse wheel rotates **each individual molecule** around its own center of mass (X-Axis rotation). This allows for local inspection of 3D structures without altering the global camera angle.
    *   **Subatomic Tools:** Dedicated tools to shoot Electrons/Protons/Neutrons.
    *   **Lasso:** Area selection to group atoms or trigger gravity wells.
*   **Mobile (Touch):**
    *   **Tap:** Spawn atom.
    *   **Long Press:** Open Isotope Selector.
    *   **Ghost Drag:** Vertical drag from palette spawns atom.
    *   **Overlay UI:** Controls float over canvas to maximize visibility.

#### 4.2. Visual Feedback
*   **Floating Labels:** 
    *   When a molecule is identified (e.g., "Water", "Ethanol"), a text label follows the group.
    *   **Lifecycle:** The label fades out naturally after a few seconds.
    *   **Instant Removal:** If a bond breaks or an atom is consumed by a new reaction, the label is removed **instantly** (0 frames) to prevent "ghosting" or misleading state information.
*   **View Modes:**
    *   **Solid:** Traditional sphere rendering with specular highlights.
    *   **Glass:** Translucent rendering showing internal volume and density gradients.
*   **Subatomic Visualization:**
    *   **Protons:** Rendered as small red particles ($r=20$) labeled "p⁺".
    *   **Neutrons:** Rendered as small blue particles ($r=20$) labeled "n".
    *   **Hydrogen Isotopes:** Distinct from bare protons; heavy isotopes (Deuterium/Tritium) or neutral Hydrogen are rendered as standard-sized white atoms ($r \approx 40$) labeled "H⁺" or "H".
    *   **Electrons:** Rendered as **large, diffuse white clouds** (Radius ~30u) to represent their quantum probability distribution. They appear larger than nuclei and lack sharp edges.

#### 4.3. Periodic Table & Palette
*   **Periodic Table:** Full 118-element support with IUPAC layout.
*   **Palette:**
    *   Customizable list of "Active" elements.
    *   Dropdown for Isotope selection (e.g., U-235 vs U-238).
    *   **Time Slider:** Logarithmic control from Real-time (1x) to Geologic Time (10,000x).

---

### 5. Technical Specifications

*   **Framework:** React 19.
*   **Rendering:** HTML5 `<canvas>` Context 2D.
*   **Coordinate System:**
    *   **FOV:** High FOV (3500) to create a flattened perspective, minimizing near-plane clipping when large molecules rotate deep into the Z-axis.
    *   **Z-Depth:** Simulation supports Z coordinates up to $\pm 10,000$.
*   **State Management:**
    *   **React:** UI State.
    *   **Refs (Mutable):** Physics World (Atoms array, Particles array) for high-performance (60fps) simulation loop without React reconciliation overhead.
*   **Performance:**
    *   **Sub-stepping:** 8 physics updates per render frame.
    *   **Spatial Optimization:** Pair-loops are optimized to $O(N^2/2)$ with distance checks.
    *   **Memory:** Zero-allocation patterns where possible in the hot loop (reusing vectors/objects implicitly via float math).

---

### 6. System Verification Suite (Integration Testing)

To ensure the integrity of the physics engine and the interplay between nuclear and chemical systems, the application includes a scripted "System Test" (`TEST_SYS`).

#### 6.1. Nuclear Chain Verification
The test validates the subatomic interaction pipeline:
1.  **Proton Spawn:** Initializes a $p^+$ target (Radius 20).
2.  **Neutron Capture:** Shoots a neutron ($n$) to impact the proton, forming a Deuteron ($H^2$, Charge +1). 
    *   **Verification:** Checks mass increase, charge preservation, and **radius expansion** (atom must grow to ~40u).
3.  **Electron Capture:** Shoots an electron ($e^-$) to impact the Deuteron, forming Neutral Deuterium ($H^2$, Charge 0). Verifies charge normalization.
4.  **Beta Decay Chain:** Shoots 2 additional neutrons to form Hydrogen-4 ($H^4$). The system waits for probabilistic beta decay to transmute $H^4 \rightarrow He^4$ (Helium-4).

#### 6.2. Chemical Synthesis Verification
The test validates the molecular assembly pipeline ("Super Crunch"):
1.  **Persistence:** The board is **not cleared** after the nuclear test; subsequent tests occur in spatially distinct zones to verify world persistence.
2.  **Sequential Synthesis:**
    *   **Ionic Water ($H_3O^+$ equivalent):** Tests electrostatic attraction and manual assembly.
    *   **Water ($H_2O$):** Synthesized at Center.
    *   **Benzene ($C_6H_6$):** Synthesized at Center (Pushes Water).
    *   **Cyclohexane ($C_6H_{12}$):** Synthesized at Center (Pushes Benzene).
3.  **Validation Criteria:** Each step uses `identifyMolecule` logic to confirm the geometric arrangement of atoms matches the target compound name within the simulation.

---

### 7. Physics Rulebook (Immutable Laws)

This section defines the hard-coded rules governing the simulation. Any code changes must strictly adhere to these parameters.

#### 7.1 Fundamental Particles
*   **Proton ($p^+$):**
    *   **Z:** 1 (but distinct from H atom).
    *   **Charge:** +1.
    *   **Mass:** ~1.007 u.
    *   **Radius:** 20 (Small).
    *   **Color:** Red `#FF3333`.
    *   **Interaction:** Attracts Electrons. Repels Protons. Fuses with Neutrons.
*   **Neutron ($n$):**
    *   **Z:** 0.
    *   **Charge:** 0.
    *   **Mass:** ~1.008 u.
    *   **Radius:** 20 (Small).
    *   **Color:** Blue `#3333FF`.
    *   **Interaction:** No electrostatic force. Captured by Nuclei via collision.
    *   **Decay:** Free neutrons decay via Beta- ($\tau \approx 15$ min).
*   **Electron ($e^-$):**
    *   **Z:** -1.
    *   **Charge:** -1.
    *   **Mass:** ~0.0005 u.
    *   **Radius:** 30 (Large, diffuse cloud).
    *   **Color:** White `#FFFFFF`.
    *   **Interaction:** Attracts Protons. Repels Electrons. Captured by Nuclei.
*   **Positron ($e^+$):**
    *   **Z:** -2 (Logic ID).
    *   **Charge:** +1.
    *   **Color:** Pink `#FF9999`.
    *   **Interaction:** 
        *   **With Free Electron:** Annihilates immediately upon contact ($d < r_1 + r_2$).
        *   **With Atom:** If colliding with a neutral or negative atom ($Z \ge 1$, Charge < Z), it annihilates a **bound electron**. The Positron vanishes, and the Atom's charge increases by +1 (Ionization).
*   **Quarks (Up/Down):**
    *   **Z:** 1000.
    *   **Radius:** 15 (Tiny).
    *   **Lifespan:** Decays after 5s if not Hadronized.
    *   **Hadronization:** 3 Quarks (uud or udd) within 500px proximity merge into Proton/Neutron.

#### 7.2 Atomic Physics
*   **Hydrogen Exception:**
    *   If Mass < 1.6 AND Charge >= 1: Treat as **Bare Proton** (Radius 20).
    *   Otherwise (H-2, H-3, or Neutral H): Treat as **Atomic Hydrogen** (Radius ~40).
*   **Radius Scaling:** $R = 30 + m^{0.33} \times 10$. (Heavier atoms are larger).
*   **Charge Snapping:** Isolated atoms (0 bonds) **MUST** have integer charges. Partial charges (e.g. +0.33) are strictly forbidden on single atoms and must be rounded.

#### 7.3 Bonding Rules
*   **Forbidden Bonds:**
    *   **Noble Gases:** He (2), Ne (10), Ar (18) cannot bond with *anything*.
    *   **Heavy Noble Gases:** Kr (36), Xe (54), Rn (86) can *only* bond with Oxygen (8) or Fluorine (9).
    *   **Metal-Hydrides:** Metals (Li, Na, K, Fe, U...) cannot bond with Hydrogen (1) in this simulation (simplified to avoid messy hydrides).
    *   **Metal-Carbides:** Metals cannot bond with Carbon (6).
*   **Hypervalency:**
    *   **Halogens (Group 17):** Max 1 bond, *unless* bonded to O, F, or Cl (then expanded).
    *   **Chalcogens (Group 16):** Max 2 bonds, *unless* bonded to O, F, or Cl.
*   **Ghost Bonds:** Bonds exceeding **5x** equilibrium length are physically impossible and must be pruned immediately.

#### 7.4 Nuclear Processes
*   **Fusion:**
    *   Requires overlap ($d < r_1 + r_2$) and high kinetic energy (implied by user throwing/explosion).
    *   **H-H Fusion:** H-1 + H-1 $\rightarrow$ H-2 (Deuterium).
    *   **Triple Alpha:** 3x He-4 $\rightarrow$ C-12.
    *   **Iron Limit:** Fusion stops at Fe-56.
*   **Decay:**
    *   **Alpha:** Ejects He-4 particle. Recoil velocity applied.
    *   **Beta-:** Neutron $\rightarrow$ Proton. Electron emitted.
    *   **Spontaneous Fission:** Atom splits into two smaller chunks + 2-3 Neutrons.
    *   **Protection:** Beta decay does not occur if `lastDecayCheck` < 300ms (Grace Period).
