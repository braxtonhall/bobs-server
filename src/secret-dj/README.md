# Secret DJ

## Operations

2. ~~Create a game~~
3. ~~Get active games~~
4. ~~Enrol in one of the games~~
5. ~~Edit rules (doesn't work once the game has started)~~
6. ~~Start game~~
7. ~~Submit your playlist~~
8. View your old games
9. Get entries for some game

ALSO when you make a game it should always get a new BOX associated with it :)

## vomit

walking through multiple userflow

- leader become a participant
- once leader is a participant they can create a game (SIGN_UP state)
  - leader can't create a game/join a game without being a participant
  - should be able to delete a game? deletion only allowed for games in sign up state
- leader creates a game w rule count
  - rule count uneditable, should delete game if they messed up
- new participants join
- they add their rules
- they can all edit their rules ad infinitum
- the game starts, season state changed (IN_PROGRESS state)
  - can't start a game i'm not an owner of (participants can't start the game)
  - can't start a game that doesn't exist
  - no one can edit their rules anymore
- game state has matched people up, everyone has a match
- people submit playlists, the database state correctly updates the submission URL for their recipient
- people can edit their playlist submissions in this state
- after 4 hours, assume the game state has changed to ended (ENDED state)
  - no one can edit their playlist submissions anymore
  - also verify that no one can posthoc change thier rules anymore
- everyone has a playlist, yay
- check everyones participant games, owner should be ONLY owner, other participants should appear in recipient and dj entries
