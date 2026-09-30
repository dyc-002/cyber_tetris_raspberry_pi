export const PIECE_COLORS = [
  '#39e6a5',
  '#4ca3ff',
  '#b47cff',
  '#ff4f81',
  '#ffc857',
  '#55d6be',
  '#ff7849'
];

const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]]
];

export function createBoard(cols = 10, rows = 20) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function createPiece(type = 0) {
  const matrix = SHAPES[type].map((row) => row.slice());
  return { x: 0, y: 0, color: type + 1, matrix };
}

export function randomPiece() {
  const type = Math.floor(Math.random() * SHAPES.length);
  return createPiece(type);
}

export function collides(board, piece) {
  for (let y = 0; y < piece.matrix.length; y += 1) {
    for (let x = 0; x < piece.matrix[y].length; x += 1) {
      if (!piece.matrix[y][x]) continue;

      const boardX = piece.x + x;
      const boardY = piece.y + y;

      if (boardX < 0 || boardX >= board[0].length || boardY >= board.length) {
        return true;
      }

      if (boardY >= 0 && board[boardY][boardX] !== 0) {
        return true;
      }
    }
  }

  return false;
}

export function mergePiece(board, piece) {
  const nextBoard = board.map((row) => row.slice());

  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;

      const boardX = piece.x + x;
      const boardY = piece.y + y;

      if (boardY >= 0 && boardY < nextBoard.length && boardX >= 0 && boardX < nextBoard[0].length) {
        nextBoard[boardY][boardX] = piece.color;
      }
    });
  });

  return nextBoard;
}

export function rotateMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      rotated[x][rows - 1 - y] = matrix[y][x];
    }
  }

  return rotated;
}

export function clearLines(board) {
  const blankRow = Array(board[0].length).fill(0);
  const remaining = [];
  let linesCleared = 0;

  for (const row of board) {
    if (row.every((cell) => cell !== 0)) {
      linesCleared += 1;
    } else {
      remaining.push(row.slice());
    }
  }

  while (remaining.length < board.length) {
    remaining.unshift(blankRow.slice());
  }

  return {
    board: remaining.slice(0, board.length),
    linesCleared
  };
}

export function getDropInterval(level) {
  return Math.max(90, 700 - (level - 1) * 55);
}

const CYBER_SECURITY_QUESTIONS = {
  easy: [
    {
      prompt: 'What does the CIA triad stand for?',
      choices: ['Control, Internet, Access', 'Confidentiality, Integrity, Availability', 'Cybersecurity, Internet, Authentication', 'Confidentiality, Internet, Administration'],
      answerIndex: 1
    },
    {
      prompt: 'What is phishing?',
      choices: ['A type of firewall', 'A method of encrypting files', 'A fraudulent attempt to obtain sensitive information', 'A computer backup method'],
      answerIndex: 2
    },
    {
      prompt: 'Which of these is a strong password?',
      choices: ['password123', 'john2005', '12345678', 'T9$kL2!qP7#z'],
      answerIndex: 3
    },
    {
      prompt: 'What does malware mean?',
      choices: ['Malicious software', 'Managed software', 'Manual hardware', 'Main software'],
      answerIndex: 0
    },
    {
      prompt: 'Which device is commonly used to filter network traffic?',
      choices: ['Monitor', 'Firewall', 'Keyboard', 'Printer'],
      answerIndex: 1
    },
    {
      prompt: 'What is a computer virus?',
      choices: ['A physical computer component', 'Malicious software that can replicate and spread', 'A type of monitor', 'A network cable'],
      answerIndex: 1
    },
    {
      prompt: 'What is encryption used for?',
      choices: ['Making data unreadable without the appropriate key', 'Increasing internet speed', 'Deleting viruses', 'Increasing storage space'],
      answerIndex: 0
    },
    {
      prompt: 'What is authentication?',
      choices: ['Checking what a user is allowed to do', 'Proving who a user is', 'Encrypting a hard drive', 'Blocking a website'],
      answerIndex: 1
    },
    {
      prompt: 'What is a username primarily used for?',
      choices: ['Identifying an account', 'Encrypting files', 'Blocking malware', 'Increasing bandwidth'],
      answerIndex: 0
    },
    {
      prompt: 'What does antivirus software help protect against?',
      choices: ['Hardware failures', 'Malware', 'Slow internet', 'Power cuts'],
      answerIndex: 1
    },
    {
      prompt: 'What is a firewall?',
      choices: ['A security system that controls network traffic', 'A type of password', 'A storage device', 'A programming language'],
      answerIndex: 0
    },
    {
      prompt: 'What is social engineering?',
      choices: ['Designing social media websites', 'Manipulating people into revealing information or taking an action', 'Building computer networks', 'Encrypting databases'],
      answerIndex: 1
    },
    {
      prompt: 'Why should software be updated?',
      choices: ['To remove the keyboard', 'To improve security and fix vulnerabilities', 'To delete user accounts', 'To reduce storage'],
      answerIndex: 1
    },
    {
      prompt: 'What is two-factor authentication (2FA)?',
      choices: ['Using two usernames', 'Using two different types of authentication factors', 'Having two computers', 'Using two passwords at once'],
      answerIndex: 1
    },
    {
      prompt: 'Which is an example of biometric authentication?',
      choices: ['Password', 'PIN', 'Fingerprint', 'Username'],
      answerIndex: 2
    },
    {
      prompt: 'What is ransomware?',
      choices: ['Malware that encrypts or locks data and demands payment', 'A type of firewall', 'A secure backup system', 'An antivirus program'],
      answerIndex: 0
    },
    {
      prompt: 'What should you do with a suspicious email attachment?',
      choices: ['Open it immediately', 'Forward it to everyone', 'Avoid opening it and report it', 'Download it to your phone'],
      answerIndex: 2
    },
    {
      prompt: 'What does VPN stand for?',
      choices: ['Virtual Private Network', 'Verified Public Network', 'Virtual Protected Node', 'Verified Private Node'],
      answerIndex: 0
    },
    {
      prompt: 'What is a security vulnerability?',
      choices: ['A weakness that could be exploited', 'A strong password', 'A backup', 'A firewall rule'],
      answerIndex: 0
    },
    {
      prompt: 'What is a cyberattack?',
      choices: ['An attempt to compromise a computer system or network', 'A software update', 'A computer restart', 'A normal login'],
      answerIndex: 0
    },
    {
      prompt: 'Which password is easiest to guess?',
      choices: ['X7!mP#92q', 'Summer2026', '8$kL!2pQ', 'vN4@zT91'],
      answerIndex: 1
    },
    {
      prompt: 'What is spyware?',
      choices: ['Software designed to secretly monitor or collect information', 'Software for creating backups', 'A firewall', 'A programming language'],
      answerIndex: 0
    },
    {
      prompt: 'What is a backup?',
      choices: ['A copy of data kept for recovery', 'A type of malware', 'A password manager', 'A firewall'],
      answerIndex: 0
    },
    {
      prompt: 'What is a DDoS attack designed to do?',
      choices: ['Make a service unavailable by overwhelming it with traffic', 'Steal a keyboard', 'Encrypt a password', 'Install antivirus software'],
      answerIndex: 0
    },
    {
      prompt: 'What is a username and password combination an example of?',
      choices: ['Authentication credentials', 'Encryption', 'Malware', 'Network routing'],
      answerIndex: 0
    },
    {
      prompt: 'Which connection is generally safer for sensitive online activity?',
      choices: ['Open public Wi-Fi', 'Unsecured Wi-Fi', 'A trusted secured network', 'Unknown hotspot'],
      answerIndex: 2
    },
    {
      prompt: 'What does HTTPS provide?',
      choices: ['An encrypted connection between a browser and website', 'Faster CPU performance', 'More storage', 'Automatic antivirus protection'],
      answerIndex: 0
    },
    {
      prompt: 'What is a brute-force attack?',
      choices: ['Guessing passwords repeatedly', 'Physically destroying a computer', 'Encrypting a website', 'Installing updates'],
      answerIndex: 0
    },
    {
      prompt: 'What is a security patch?',
      choices: ['An update designed to fix security vulnerabilities', 'A physical computer component', 'A password', 'A firewall'],
      answerIndex: 0
    },
    {
      prompt: 'Why should you lock your computer when leaving it unattended?',
      choices: ['To save electricity', 'To prevent unauthorised access', 'To improve internet speed', 'To install updates'],
      answerIndex: 1
    },
    {
      prompt: 'What is spam?',
      choices: ['Unwanted messages', 'Encrypted data', 'A firewall', 'A backup'],
      answerIndex: 0
    },
    {
      prompt: 'Which is an example of sensitive information?',
      choices: ['Public weather forecast', 'Password', 'Public news article', 'Computer wallpaper'],
      answerIndex: 1
    },
    {
      prompt: 'What is a password manager used for?',
      choices: ['Storing and managing passwords securely', 'Removing malware automatically', 'Increasing Wi-Fi speed', 'Blocking all websites'],
      answerIndex: 0
    },
    {
      prompt: 'What does access control determine?',
      choices: ['Who can access resources and what they can do', 'How fast a computer starts', 'How much storage a computer has', 'The colour of a website'],
      answerIndex: 0
    },
    {
      prompt: 'Which action improves account security?',
      choices: ['Reusing the same password everywhere', 'Sharing passwords with friends', 'Enabling MFA', 'Using simple passwords'],
      answerIndex: 2
    }
  ],
  medium: [
    {
      prompt: 'What is SQL injection?',
      choices: ['An attack involving malicious SQL input', 'A type of encryption', 'A network cable', 'A backup technique'],
      answerIndex: 0
    },
    {
      prompt: 'What is XSS?',
      choices: ['Cross-Site Scripting', 'Extended Security System', 'External Server Security', 'Cross-System Storage'],
      answerIndex: 0
    },
    {
      prompt: 'What is the principle of least privilege?',
      choices: ['Giving users the maximum possible access', 'Giving users only the access they need', 'Removing all user accounts', 'Giving everyone administrator access'],
      answerIndex: 1
    },
    {
      prompt: 'What is hashing primarily used for?',
      choices: ['Creating a fixed-length representation of data', 'Increasing internet speed', 'Compressing video', 'Routing network traffic'],
      answerIndex: 0
    },
    {
      prompt: 'Why are passwords normally stored using hashes rather than plaintext?',
      choices: ['Hashes can help prevent the original password being directly exposed', 'Hashes make passwords easier to read', 'Hashes increase monitor resolution', 'Hashes make Wi-Fi faster'],
      answerIndex: 0
    },
    {
      prompt: 'What is a salt in password hashing?',
      choices: ['Random data added before hashing', 'A type of firewall', 'A network cable', 'A password itself'],
      answerIndex: 0
    },
    {
      prompt: 'What is a man-in-the-middle attack?',
      choices: ['An attacker intercepts communication between parties', 'An attacker physically steals a monitor', 'An attacker deletes an operating system', 'An attacker installs a printer'],
      answerIndex: 0
    },
    {
      prompt: 'What is DNS used for?',
      choices: ['Translating domain names into IP addresses', 'Encrypting hard drives', 'Scanning USB drives', 'Creating passwords'],
      answerIndex: 0
    },
    {
      prompt: 'What is an IP address?',
      choices: ['An address used to identify a device/interface on a network', 'A password', 'A virus', 'A file extension'],
      answerIndex: 0
    },
    {
      prompt: 'What is port scanning used for?',
      choices: ['Identifying network ports and potentially exposed services', 'Increasing storage', 'Encrypting emails', 'Removing cookies'],
      answerIndex: 0
    },
    {
      prompt: 'What is a zero-day vulnerability?',
      choices: ['A vulnerability unknown to the vendor or without an available patch at the time of exploitation', 'A vulnerability that is always harmless', 'A password reset', 'A backup failure'],
      answerIndex: 0
    },
    {
      prompt: 'What is endpoint security?',
      choices: ['Protecting devices such as computers and phones', 'Protecting only websites', 'Protecting only routers', 'Protecting only passwords'],
      answerIndex: 0
    },
    {
      prompt: 'What does IDS stand for?',
      choices: ['Intrusion Detection System', 'Internet Data Service', 'Internal Device Security', 'Information Database System'],
      answerIndex: 0
    },
    {
      prompt: 'What does IPS stand for?',
      choices: ['Internet Protection Service', 'Intrusion Prevention System', 'Internal Password System', 'Internet Processing Software'],
      answerIndex: 1
    },
    {
      prompt: 'What is the main difference between an IDS and an IPS?',
      choices: ['IDS detects; IPS can detect and actively prevent/block', 'IDS encrypts; IPS decrypts', 'IDS stores files; IPS deletes them', 'There is no difference'],
      answerIndex: 0
    },
    {
      prompt: 'What is network segmentation?',
      choices: ['Dividing a network into separate sections', 'Removing all network devices', 'Increasing monitor resolution', 'Encrypting every file'],
      answerIndex: 0
    },
    {
      prompt: 'What is a VLAN commonly used for?',
      choices: ['Logically separating network traffic', 'Increasing CPU speed', 'Storing passwords', 'Detecting viruses'],
      answerIndex: 0
    },
    {
      prompt: 'What is MFA?',
      choices: ['Multi-Factor Authentication', 'Multiple Firewall Access', 'Managed File Authentication', 'Main Factor Access'],
      answerIndex: 0
    },
    {
      prompt: 'Which is an authentication factor based on possession?',
      choices: ['Password', 'Fingerprint', 'Security token', 'Username'],
      answerIndex: 2
    },
    {
      prompt: 'Which is an authentication factor based on knowledge?',
      choices: ['Password', 'Fingerprint', 'Security token', 'Face scan'],
      answerIndex: 0
    },
    {
      prompt: 'What is a digital certificate used for?',
      choices: ['Helping authenticate identities and establish secure communications', 'Increasing storage capacity', 'Removing malware', 'Creating usernames'],
      answerIndex: 0
    },
    {
      prompt: 'What is TLS primarily used for?',
      choices: ['Securing communications over networks', 'Increasing CPU performance', 'Deleting files', 'Creating backups'],
      answerIndex: 0
    },
    {
      prompt: 'What is a public key in asymmetric cryptography?',
      choices: ['A key that can generally be shared publicly', 'A password that must always remain secret', 'A firewall rule', 'A username'],
      answerIndex: 0
    },
    {
      prompt: 'What should normally happen to a private cryptographic key?',
      choices: ['It should be kept secret', 'It should be posted online', 'It should be shared with everyone', 'It should be stored in a public database'],
      answerIndex: 0
    },
    {
      prompt: 'What is penetration testing?',
      choices: ['Authorised testing designed to identify security weaknesses', 'Randomly attacking websites', 'Installing games', 'Testing monitor brightness'],
      answerIndex: 0
    },
    {
      prompt: 'What is vulnerability scanning?',
      choices: ['Automatically checking systems for known weaknesses', 'Guessing usernames manually', 'Encrypting files', 'Creating websites'],
      answerIndex: 0
    },
    {
      prompt: 'What is an exploit?',
      choices: ['Code, technique, or method that takes advantage of a vulnerability', 'A type of password', 'A backup', 'A firewall'],
      answerIndex: 0
    },
    {
      prompt: 'What is privilege escalation?',
      choices: ['Obtaining higher privileges than originally authorised', 'Creating a new email', 'Updating antivirus software', 'Changing a username'],
      answerIndex: 0
    },
    {
      prompt: 'What is a security log?',
      choices: ['A record of security-related events', 'A password list', 'A firewall cable', 'An encrypted hard drive'],
      answerIndex: 0
    },
    {
      prompt: 'What is SIEM commonly used for?',
      choices: ['Collecting and analysing security event data', 'Creating video games', 'Increasing RAM', 'Designing websites'],
      answerIndex: 0
    },
    {
      prompt: 'What is incident response?',
      choices: ['The process of detecting, containing and responding to security incidents', 'Installing a new monitor', 'Creating a social media account', 'Increasing network speed'],
      answerIndex: 0
    },
    {
      prompt: 'What is data exfiltration?',
      choices: ['Unauthorised transfer of data out of a system', 'Data backup', 'Data encryption', 'Data compression'],
      answerIndex: 0
    },
    {
      prompt: 'What is a botnet?',
      choices: ['A network of compromised devices controlled by an attacker', 'A secure private network', 'A firewall', 'A password manager'],
      answerIndex: 0
    },
    {
      prompt: 'What is endpoint detection and response (EDR)?',
      choices: ['Technology used to monitor and respond to suspicious endpoint activity', 'A type of Wi-Fi cable', 'A password algorithm', 'A database format'],
      answerIndex: 0
    },
    {
      prompt: 'Why is logging important in cybersecurity?',
      choices: ['It can provide evidence and help detect and investigate incidents', 'It makes passwords longer', 'It automatically prevents every attack', 'It increases screen resolution'],
      answerIndex: 0
    }
  ],
  hard: [
    {
      prompt: 'What is a race condition vulnerability?',
      choices: ['A vulnerability caused by unexpected timing/order between operations', 'A weak password', 'A type of encryption', 'A network cable fault'],
      answerIndex: 0
    },
    {
      prompt: 'What is a buffer overflow?',
      choices: ['Writing data beyond the intended bounds of a buffer', 'Running out of internet bandwidth', 'Encrypting too many files', 'Deleting a database'],
      answerIndex: 0
    },
    {
      prompt: 'What is command injection?',
      choices: ['An attack where unintended system commands are executed through an application', 'A firewall configuration', 'A password hashing technique', 'A backup method'],
      answerIndex: 0
    },
    {
      prompt: 'What is a supply-chain attack?',
      choices: ['Compromising software, hardware or services through a trusted supplier or dependency', 'Stealing a physical computer', 'Guessing passwords', 'Blocking a website'],
      answerIndex: 0
    },
    {
      prompt: 'What is lateral movement?',
      choices: ['Moving between systems after gaining an initial foothold', 'Moving a computer physically', 'Changing a password', 'Updating software'],
      answerIndex: 0
    },
    {
      prompt: 'What is persistence in cybersecurity?',
      choices: ['Maintaining access to a compromised system over time', 'Making a password permanent', 'Keeping a computer switched on', 'Saving a document'],
      answerIndex: 0
    },
    {
      prompt: 'What is privilege escalation commonly used for?',
      choices: ['Obtaining permissions that were not originally available', 'Improving internet speed', 'Creating backups', 'Updating software'],
      answerIndex: 0
    },
    {
      prompt: 'What is Kerberos primarily used for?',
      choices: ['Network authentication', 'Disk formatting', 'Malware detection', 'Database compression'],
      answerIndex: 0
    },
    {
      prompt: 'What is Active Directory primarily used for?',
      choices: ['Managing identities, computers and resources in Windows-based environments', 'Encrypting every internet connection', 'Removing malware', 'Creating websites'],
      answerIndex: 0
    },
    {
      prompt: 'What is an ACL?',
      choices: ['Access Control List', 'Automated Cybersecurity Login', 'Advanced Certificate Layer', 'Access Configuration Language'],
      answerIndex: 0
    },
    {
      prompt: 'What is a zero-trust security model based on?',
      choices: ['Trusting all internal users automatically', 'Continuously verifying access rather than automatically trusting users or devices', 'Removing authentication', 'Allowing anonymous administrator access'],
      answerIndex: 1
    },
    {
      prompt: 'What is a reverse shell?',
      choices: ['A connection where a target system initiates a command shell connection back to another system', 'A type of firewall', 'A backup system', 'A password manager'],
      answerIndex: 0
    },
    {
      prompt: 'What is command-and-control (C2)?',
      choices: ['Infrastructure used by attackers to communicate with compromised systems', 'A database backup', 'A firewall rule', 'An encryption algorithm'],
      answerIndex: 0
    },
    {
      prompt: 'What is DNS tunnelling?',
      choices: ['Using DNS queries/responses to covertly transfer data or communicate', 'Encrypting a DNS server\'s hard drive', 'Blocking DNS requests', 'Changing a domain name'],
      answerIndex: 0
    },
    {
      prompt: 'What is a watering-hole attack?',
      choices: ['Compromising a website likely to be visited by a target group', 'Flooding a server with water', 'Attacking a Wi-Fi router physically', 'Encrypting a website'],
      answerIndex: 0
    },
    {
      prompt: 'What is spear phishing?',
      choices: ['Highly targeted phishing aimed at a specific person or organisation', 'Random spam', 'A firewall attack', 'A physical attack'],
      answerIndex: 0
    },
    {
      prompt: 'What is whaling?',
      choices: ['Phishing targeting high-value individuals such as executives', 'Malware targeting whales', 'A DDoS technique', 'Password hashing'],
      answerIndex: 0
    },
    {
      prompt: 'What is a cryptographic nonce?',
      choices: ['A value intended to be used once in a particular cryptographic context', 'A permanent password', 'A firewall rule', 'A username'],
      answerIndex: 0
    },
    {
      prompt: 'What is forward secrecy?',
      choices: ['Protecting past session data even if a long-term private key is later compromised', 'Preventing all future attacks', 'Encrypting passwords twice', 'Hiding a username'],
      answerIndex: 0
    },
    {
      prompt: 'What is a replay attack?',
      choices: ['Reusing captured valid data or authentication messages to perform an unauthorised action', 'Replaying a video', 'Restarting a server', 'Reinstalling software'],
      answerIndex: 0
    },
    {
      prompt: 'What is certificate pinning designed to help prevent?',
      choices: ['Unauthorised certificates being accepted for a specific application/service', 'Password reuse', 'Malware execution', 'DDoS attacks'],
      answerIndex: 0
    },
    {
      prompt: 'What is an HMAC?',
      choices: ['A message authentication code using a cryptographic hash and secret key', 'A type of firewall', 'A network protocol', 'A password manager'],
      answerIndex: 0
    },
    {
      prompt: 'What is asymmetric encryption based on?',
      choices: ['A pair of mathematically related keys', 'One password only', 'A firewall rule', 'A username and PIN'],
      answerIndex: 0
    },
    {
      prompt: 'What is a cryptographic collision?',
      choices: ['Two different inputs producing the same hash output', 'Two computers using the same IP address', 'Two users having the same username', 'Two firewalls blocking each other'],
      answerIndex: 0
    },
    {
      prompt: 'What is an exploit chain?',
      choices: ['Multiple vulnerabilities or techniques combined to achieve an attack objective', 'A chain of encrypted passwords', 'A series of firewall rules', 'A backup sequence'],
      answerIndex: 0
    },
    {
      prompt: 'What is an insecure deserialization vulnerability?',
      choices: ['Unsafe processing of serialized data that can allow unintended behaviour or code execution', 'A weak Wi-Fi signal', 'A failed backup', 'An expired certificate'],
      answerIndex: 0
    },
    {
      prompt: 'What is SSRF?',
      choices: ['Server-Side Request Forgery', 'Secure Server Routing Framework', 'System Security Response Function', 'Server Storage Recovery Format'],
      answerIndex: 0
    },
    {
      prompt: 'What can SSRF potentially allow an attacker to do?',
      choices: ['Cause a server to make requests to unintended internal or external resources', 'Automatically repair a server', 'Increase RAM', 'Encrypt a hard drive'],
      answerIndex: 0
    },
    {
      prompt: 'What is a threat model?',
      choices: ['A structured way of identifying threats, attackers, assets and potential attack paths', 'A type of malware', 'A password database', 'A firewall configuration'],
      answerIndex: 0
    },
    {
      prompt: 'What is defence in depth?',
      choices: ['Using multiple layers of security controls', 'Using one extremely strong password', 'Removing all network security', 'Using only antivirus software'],
      answerIndex: 0
    }
  ]
};

export function getCyberSecurityQuestion(mode = 'easy') {
  const safeMode = ['easy', 'medium', 'hard'].includes(mode) ? mode : 'easy';
  const pool = CYBER_SECURITY_QUESTIONS[safeMode];
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return {
    ...selected,
    mode: safeMode,
    correctAnswer: selected.choices[selected.answerIndex]
  };
}

export function getDifficultyByPlayTime(msPlayed = 0) {
  if (msPlayed >= 180000) return 'hard';
  if (msPlayed >= 60000) return 'medium';
  return 'easy';
}

export function getCyberSecurityQuestionByTime(msPlayed = 0) {
  return getCyberSecurityQuestion(getDifficultyByPlayTime(msPlayed));
}

export function getShapeRewardPool(size = 3) {
  const pool = Array.from({ length: 7 }, (_, index) => index);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.max(1, Math.min(size, pool.length)));
}