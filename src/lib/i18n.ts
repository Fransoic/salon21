import type { RoundPhase } from './game/types'
import type { AppLanguage } from './storage'

const copy = {
    en: {
        appTitle: 'Salon 21',
        bankroll: 'Bankroll',
        bet: 'Bet',
        swing: 'Swing',
        hands: 'Hands',
        evenRound: 'Even round',
        options: 'Options',
        strategy: 'Strategy',
        localSession: 'Local Session',
        tableControls: 'Table controls',
        basicStrategy: 'Basic strategy',
        openOptions: 'Open options',
        close: 'Close',
        optionsSections: 'Options sections',
        betting: 'Betting',
        chooseStake: 'Choose your stake',
        bettingHint: 'Table minimum is $10. Betting locks once the round is dealt.',
        insufficientBankroll: 'Insufficient bankroll',
        selected: 'Selected',
        tapToWager: 'Tap to wager',
        tableActions: 'Table Actions',
        playHand: 'Play the hand',
        dealerResolving: 'Dealer is resolving the table.',
        deal: 'Deal',
        startNextHand: 'Start the next hand',
        takeInsurance: 'Take Insurance',
        sideBetHalfStake: 'Side bet at half stake',
        noInsurance: 'No Insurance',
        continueWithoutCover: 'Continue without cover',
        hit: 'Hit',
        takeOneCard: 'Take one card',
        stand: 'Stand',
        lockThisHand: 'Lock this hand',
        double: 'Double',
        doubleStakeOneCard: 'Double stake, one card',
        split: 'Split',
        breakPairTwoHands: 'Break a pair into two hands',
        surrender: 'Surrender',
        foldForHalfBack: 'Fold for half back',
        nextRound: 'Next Round',
        clearTable: 'Clear the table',
        dealer: 'Dealer',
        houseHand: 'House Hand',
        player: 'Player',
        waitingNextRound: 'Waiting for the next round',
        tapDeal: 'Tap Deal',
        persistenceHint: 'Your bankroll, selected bet, and table stats persist locally on this device.',
        playerHand: 'Player Hand',
        onFelt: 'on the felt',
        splitHand: 'Split hand',
        openingHand: 'Opening hand',
        doubled: 'Doubled',
        returned: 'Returned',
        inPlay: 'In play',
        hiddenDealerCard: 'Hidden dealer card',
        sound: 'Sound',
        volume: 'Volume',
        volumeHint: 'Master volume for chip, action, and round sounds.',
        interface: 'Interface',
        language: 'Language',
        languageHint: 'Preferred interface language.',
        tableSnapshot: 'Table snapshot',
        currentBankroll: 'Current bankroll',
        tableBet: 'Table bet',
        wins: 'Wins',
        losses: 'Losses',
        pushes: 'Pushes',
        blackjacks: 'Blackjacks',
        sessionStats: 'Session stats',
        handsPlayed: 'Hands played',
        peakBankroll: 'Peak bankroll',
        houseRules: 'House rules',
        houseRulesCoreTitle: 'Core',
        houseRulesCoreBody: '6 decks, dealer stands on soft 17, blackjack pays 3:2, insurance pays 2:1.',
        houseRulesAdvancedTitle: 'Advanced',
        houseRulesAdvancedBody: 'Double after split, late surrender, resplit to four hands except aces, split aces draw one card only.',
        houseRulesPersistenceTitle: 'Persistence',
        houseRulesPersistenceBody: 'Bankroll, selected bet, and table stats stay on this device until reset.',
        resetLocalProgress: 'Reset local progress',
        resetConfirm: 'Reset bankroll, saved bet, and all local stats?',
        languageEnglish: 'English',
        languageFrench: 'French',
        phaseBetting: 'betting',
        phaseInsurance: 'insurance',
        phasePlayerTurn: 'player turn',
        phaseDealerTurn: 'dealer turn',
        phaseRoundOver: 'round over',
    },
    fr: {
        appTitle: 'Salon 21',
        bankroll: 'Cagnotte',
        bet: 'Mise',
        swing: 'Variation',
        hands: 'Mains',
        evenRound: 'Manche nulle',
        options: 'Options',
        strategy: 'Strategie',
        localSession: 'Session locale',
        tableControls: 'Reglages de table',
        basicStrategy: 'Strategie de base',
        openOptions: 'Ouvrir les options',
        close: 'Fermer',
        optionsSections: 'Sections des options',
        betting: 'Mise',
        chooseStake: 'Choisissez votre mise',
        bettingHint: 'La mise minimum de table est de $10. La mise se verrouille apres la distribution.',
        insufficientBankroll: 'Cagnotte insuffisante',
        selected: 'Selectionne',
        tapToWager: 'Touchez pour miser',
        tableActions: 'Actions de table',
        playHand: 'Jouer la main',
        dealerResolving: 'Le croupier termine la resolution.',
        deal: 'Distribuer',
        startNextHand: 'Commencer la prochaine main',
        takeInsurance: 'Prendre assurance',
        sideBetHalfStake: 'Mise annexe a la moitie de la mise',
        noInsurance: 'Sans assurance',
        continueWithoutCover: 'Continuer sans couverture',
        hit: 'Tirer',
        takeOneCard: 'Prendre une carte',
        stand: 'Rester',
        lockThisHand: 'Verrouiller cette main',
        double: 'Doubler',
        doubleStakeOneCard: 'Doubler la mise, une carte',
        split: 'Separer',
        breakPairTwoHands: 'Scinder une paire en deux mains',
        surrender: 'Abandon',
        foldForHalfBack: 'Se coucher pour recuperer la moitie',
        nextRound: 'Manche suivante',
        clearTable: 'Nettoyer la table',
        dealer: 'Croupier',
        houseHand: 'Main de la maison',
        player: 'Joueur',
        waitingNextRound: 'En attente de la prochaine manche',
        tapDeal: 'Touchez Distribuer',
        persistenceHint: 'Votre bankroll, votre mise selectionnee et les stats restent sur cet appareil.',
        playerHand: 'Main joueur',
        onFelt: 'sur le tapis',
        splitHand: 'Main separee',
        openingHand: 'Main d ouverture',
        doubled: 'Doublee',
        returned: 'Rendue',
        inPlay: 'En jeu',
        hiddenDealerCard: 'Carte cachee du croupier',
        sound: 'Son',
        volume: 'Volume',
        volumeHint: 'Volume general pour les jetons, actions et fins de manche.',
        interface: 'Interface',
        language: 'Langue',
        languageHint: 'Langue preferee de l interface.',
        tableSnapshot: 'Instantane de table',
        currentBankroll: 'Cagnotte actuelle',
        tableBet: 'Mise de table',
        wins: 'Victoires',
        losses: 'Defaites',
        pushes: 'Egalites',
        blackjacks: 'Blackjacks',
        sessionStats: 'Stats de session',
        handsPlayed: 'Mains jouees',
        peakBankroll: 'Pic de cagnotte',
        houseRules: 'Regles de la maison',
        houseRulesCoreTitle: 'Base',
        houseRulesCoreBody: '6 decks, le croupier reste sur soft 17, blackjack paie 3:2, assurance paie 2:1.',
        houseRulesAdvancedTitle: 'Avance',
        houseRulesAdvancedBody: 'Double apres separation, abandon tardif, nouvelle separation jusqu a quatre mains sauf les as, les as separes recoivent une seule carte.',
        houseRulesPersistenceTitle: 'Persistance',
        houseRulesPersistenceBody: 'Bankroll, mise selectionnee et stats restent sur cet appareil jusqu a reinitialisation.',
        resetLocalProgress: 'Reinitialiser la progression locale',
        resetConfirm: 'Reinitialiser la bankroll, la mise enregistree et toutes les stats locales ?',
        languageEnglish: 'Anglais',
        languageFrench: 'Francais',
        phaseBetting: 'mise',
        phaseInsurance: 'assurance',
        phasePlayerTurn: 'tour joueur',
        phaseDealerTurn: 'tour croupier',
        phaseRoundOver: 'manche terminee',
    },
} as const

export type CopyKey = keyof typeof copy.en

const exactTranslations: Record<string, string> = {
    'Choose a bet and deal a new round.': 'Choisissez une mise et distribuez une nouvelle manche.',
    'Choose a bet and deal the next round.': 'Choisissez une mise et distribuez la manche suivante.',
    'Your bankroll does not cover that bet.': 'Votre bankroll ne couvre pas cette mise.',
    'Dealer shows an ace. Insurance?': 'Le croupier montre un as. Assurance ?',
    'Round dealt.': 'Cartes distribuees.',
    'Play your hand.': 'Jouez votre main.',
    'Round settled.': 'Manche terminee.',
    'Not enough bankroll to buy insurance.': 'Bankroll insuffisante pour acheter une assurance.',
    'Insurance taken.': 'Assurance prise.',
    'Insurance declined.': 'Assurance refusee.',
    'Aces split and receive one card each.': 'Les as sont separes et recoivent chacun une carte.',
    'Hand split.': 'Main separee.',
    'Hand surrendered.': 'Main abandonnee.',
    'Late surrender returns half the wager.': 'L abandon tardif rend la moitie de la mise.',
    'Dealer blackjack. Insurance pays.': 'Blackjack du croupier. L assurance paie.',
    'Dealer blackjack.': 'Blackjack du croupier.',
    'Blackjack pays 3:2.': 'Le blackjack paie 3:2.',
    'Select a valid bet before dealing.': 'Selectionnez une mise valide avant de distribuer.',
    'Hit is unavailable.': 'Tirer est indisponible.',
    'Stand is unavailable.': 'Rester est indisponible.',
    'Double is only available on the first decision with enough bankroll.': 'Doubler est disponible uniquement sur la premiere decision avec une bankroll suffisante.',
    'Split requires a pair and a matching wager.': 'Separer exige une paire et une mise correspondante.',
    'Insurance is only offered against an ace up-card.': 'L assurance est proposee uniquement contre un as visible.',
    'No insurance to decline.': 'Aucune assurance a refuser.',
    'Late surrender is only available on the opening hand.': 'L abandon tardif est disponible uniquement sur la main d ouverture.',
    'Finish the current round first.': 'Terminez d abord la manche en cours.',
    Bust: 'Brule',
    Blackjack: 'Blackjack',
    'Dealer busts': 'Le croupier brule',
    'Dealer blackjack': 'Blackjack du croupier',
    'Blackjack push': 'Egalite blackjack',
    'Player wins': 'Le joueur gagne',
    'Dealer wins': 'Le croupier gagne',
    Push: 'Egalite',
    Surrender: 'Abandon',
    'Waiting for deal': 'En attente de distribution',
}

export function uiText(language: AppLanguage, key: CopyKey): string {
    return copy[language][key]
}

export function languageOptionLabel(currentLanguage: AppLanguage, option: AppLanguage): string {
    return option === 'en' ? uiText(currentLanguage, 'languageEnglish') : uiText(currentLanguage, 'languageFrench')
}

export function phaseLabel(language: AppLanguage, phase: RoundPhase): string {
    switch (phase) {
        case 'betting':
            return uiText(language, 'phaseBetting')
        case 'insurance':
            return uiText(language, 'phaseInsurance')
        case 'player-turn':
            return uiText(language, 'phasePlayerTurn')
        case 'dealer-turn':
            return uiText(language, 'phaseDealerTurn')
        case 'round-over':
            return uiText(language, 'phaseRoundOver')
    }
}

export function translateDynamic(language: AppLanguage, text: string): string {
    if (language === 'en' || !text) {
        return text
    }

    const handToPlay = text.match(/^Hand (\d+) to play\.$/)
    if (handToPlay) {
        return `Main ${handToPlay[1]} a jouer.`
    }

    const handHits = text.match(/^Hand (\d+) hits (\d+)\.$/)
    if (handHits) {
        return `Main ${handHits[1]} tire ${handHits[2]}.`
    }

    const splitAces = text.match(/^(\d+) split aces$/)
    if (splitAces) {
        return `${splitAces[1]} apres separation des as`
    }

    const softTotal = text.match(/^(\d+) soft$/)
    if (softTotal) {
        return `${softTotal[1]} souple`
    }

    return exactTranslations[text] ?? text
}