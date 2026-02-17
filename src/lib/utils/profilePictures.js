import BabyShrek from '$lib/assets/ProfilePictures/BabyShrek.png';
import ConfusedMonkey from '$lib/assets/ProfilePictures/ConfusedMonkey.png';
import PepeTheFrog from '$lib/assets/ProfilePictures/PepeTheFrog.png';
import spooderman from '$lib/assets/ProfilePictures/spooderman.png';

const profilePictures = {
	'BabyShrek.png': BabyShrek,
	'ConfusedMonkey.png': ConfusedMonkey,
	'PepeTheFrog.png': PepeTheFrog,
	'spooderman.png': spooderman
};

const pictureNames = Object.keys(profilePictures);

export function getRandomProfilePictureName() {
	return pictureNames[Math.floor(Math.random() * pictureNames.length)];
}

export function getProfilePictureByName(name) {
	return profilePictures[name] || null;
}
