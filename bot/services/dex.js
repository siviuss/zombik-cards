import { readFileSync } from 'bun:fs';
import { formatTime, now, choose } from '@services/util.js';
import db from '@services/database.js';

export async function fetchDex() {
	const result = await db`SELECT * FROM cards ORDER BY id`;
	const cards = [];
	for (let i = 0; i < result.count; i++) {
		cards.push(result[i]);
	}
	return cards;
}

export const rarities = {
	0: {
		name: "Обычная",
		name_p: "Обычные",
		points: 1000,
		weight: 0.35,
		icon: "5809677178966645096"
	},
	1: {
		name: "Редкая",
		name_p: "Редкие",
		points: 2000,
		weight: 0.27,
		icon: "5810144316789627048"
	},
	2: {
		name: "Эпическая",
		name_p: "Эпические",
		points: 3000,
		weight: 0.2,
		icon: "5992432031731030193"
	},
	3: {
		name: "Мифическая",
		name_p: "Мифические",
		points: 4000,
		weight: 0.13,
		icon: "5992337748608948325"
	},
	4: {
		name: "Легендарная",
		name_p: "Легендарные",
		points: 5000,
		weight: 0.05,
		icon: "5895311443800103096"
	},
	5: {
		name: "Особая",
		name_p: "Особые",
		points: 10000,
		weight: 0,
		icon: "5994762846058064086"
	}
};
const raritychance = [];
Object.entries(rarities).map(entry => {
	raritychance[entry[0]] = entry[1].weight
});


/// Card logic
let cards;
let groups;
let normalised;

function chooseCard(feed, goldenBean, userCards) {
	for (let i = 0; i < 10; i++) {
		// Get group matching chosen rarity
		let groupIndex;
		let acc = 0;
		const r = Math.random();
		for (const i in normalised) {
			acc += normalised[i];
			if (r < acc) {
				groupIndex = Number(i);
				break;
			}
		}
		const group = groups[groupIndex];
		if (goldenBean) {
			group = group.filter(k => !userCards.includes(k.id));
		}
		if (group.length == 0) continue;
		
		// Choose a card from the group
		const card = choose(group);
		return card;
	}
}

export async function reloadCards() {
	cards = await fetchDex();
	// Normalise rarities and group cards by rarities
	groups = [];
	normalised = raritychance.slice(); // see annotation [1] at bottom of file
	const total = normalised.reduce((a, b) => a + b, 0);
	normalised = normalised.map(k => k / total); // k / total * 1
	for (const rarity in normalised) {
		groups[rarity] = cards.filter(k => k.rarity == rarity);
	}
}
await reloadCards();

export function getCards() {
	return cards;
}


export async function giveRandomCard(user) {
	const feed = user.feed > 0;
	const goldenBean = user.goldenbean > 0;

	const card = chooseCard(feed, goldenBean, goldenBean ? user.cards : undefined);
	if (card == null) return;

	// update card count
	const querycard = await db`SELECT exists FROM cards WHERE id=${card.id}`;
	const exists = querycard[0].exists + 1;
	card.exists = exists; // immediate update
	await db`UPDATE cards VALUES ${db({ exists })} WHERE id=${card.id}`;

	// give card
	const rarity = rarities[card.rarity];
	const coins = choose([10, 15, 20, 25, 30]);
	const duplicate = user.cards.indexOf(card.id) != -1;

	user.cardcooldown = now() + 14400;
	user.points += rarity.points;
	user.coins += coins;
	user.drops += 1;
	if (!duplicate) {
		user.cards.push(card.id);
	}
	if (feed) user.feed -= 1;
	if (goldenBean) user.goldenbean -= 1;

	return { card, rarity, coins, duplicate, exists };
}


/*

annotations

[1] We can only clone an array using .slice() and any other method wouldn't work
this is because there are empty slots in the array, as some indexes may be skipped entirely
to provide space for future official rarities, while also adding exclusive rarities.
Problem with the other methods, such as [...arr], Array.from(arr) is that they replace
empty slots with undefined values. SO when you loop over the cloned array you also take
undefined values, which would be skipped in the original array.

*/