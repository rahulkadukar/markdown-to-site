---
date: 2019-05-01
title: Fedora Installation
summary: Things to setup after a fresh installation of Fedora. This includes
  things that I use very frequently and has better notes than the documentation
tags:
  - fedora
  - setup
---

#### Setting up git

The following steps are used to generate the ssh key for easier github interaction.

```bash
  # Generate the SSH key
  ssh-keygen -t rsa -b 4096 -C "rahulkadukar@yahoo.com"

  # Add the private key using ssh-add
  ssh-add ~/.ssh/id_rsa

  # Now copy the public key and paste it into github
  cat ~/.ssh/id_rsa.pub
```

#### Enable SSH

This will enable remote login, so that this machine can be managed remotely

```bash
  # Install openssh-server if it is not installed. All actions done as root
  dnf install openssh-server

  # The following commands start and permanently enable the ssh daemon
  systemctl start sshd.service
  systemctl enable sshd.service
```

#### Configure vim and tmux

There is already a vim configuration file along with a sample theme and a tmux
configuration file that can be found in the following location

```bash
  https://github.com/rahulkadukar/notes/tree/master/config
```

Download from here and place into the correct location to enable a better vim
experience alongwith a few tmux tweaks. The following should be installed as well

```bash
  # All actions done as root
  dnf install tmux
  dnf install vim
  dnf install htop

  # Configuration of .bash_profile to enable tmux to start as tmux -2
  # Add the following line to your .bash_profile file
  alias tmux='tmux -2'
```

#### Install and configure vncserver

Download and install TigerVNC and allow it through the firewall

```bash
  # All actions done as root
  dnf install tigervnc-server

  # Allow it through the firewall
  firewall-cmd --add-service=vnc-server --permanent
  firewall-cmd --reload

  # Setup an initial password
  vncpasswd
```

#### Install Visual Studio Code

This step is optional but it is better to have some sort of Editor

```bash
  # Run the following commands to add the new repository list. All actions done as root
  rpm --import https://packages.microsoft.com/keys/microsoft.asc
  sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=
  https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=
  https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'

  # Install Visual Studio Code
  dnf install code
```

#### Install Postgresql

Install Postgres and Postgres Server. At the time of writing the repository from
Fedora had Postgres 9.6 (Upgrading is not clear and needs to be tested on a VM)

```bash
  # Get the latest RPM from yum.postgresql site
  rpm -Uvh <rpm file downloaded above>
  dnf install postgresql11-server postgresql11
  
  /usr/pgsql-11/bin/postgresql-11-setup initdb
  
  # To change the password
  su - postgres
  \password
  
  # To change the settings to enable remote connections
  # Follow steps below to change pg_hba.conf and postgresql.conf  

  # Enable the server
  systemctl enable postgresql
  systemctl start postgresql  # This will generally give an error
```

During the enabling of the server, it may give an Error. Generally the error is 
caused because there is no initial database. The database is usually located at
/var/lib/pgsql/data and needs to be initialized. The binary for initializing the 
database is located at /usr/bin/postgresql-setup --initdb

```bash
  # This command is used to initialize the database
  postgresql-setup --initdb --unit postgresql

  # Follow this up with starting the server again
  systemctl start postgresql

  # Install pgadmin3
  dnf intsall pgadmin3
```

After installing **pgadmin3** we need to change the authentication method that
is used by the postgresql server. For pgadmin3 we want to use the md5 method of
authentication. Change the /var/lib/pgsql/data/pg_hba.conf file and change the
authentication method on lines with IPv4 local connections and IPv6 local
connections from ident to md5. Once this is done, we still need to set a password
on the postgres user (who is created by default).

```bash
  # Open the shell as the user postgres
  su - postgres # Best to do this as root

  # On the shell that opens, enter the command psql
  psql

  # Here set the password with the following command
  \password
```

Set the password and use it login from pgadmin3. Once logged in create a new user
dbguy and set a password. Login to pgadmin3 using the newly created user (this is
to ensure that we do not use a superuser to access the database)

To enable access from remote machines we need to modify the file pg\_hba.conf and add
the following lines to it (one for IPv4 and one for IPv6)

```bash
  host    all             all             0.0.0.0/0         md5
  host    all             all             ::/0              md5
```

The file postgresql.conf in the same directory also needs to be modified

```bash
  listen_addresses = 'localhost,<YOUR REMOTE IP>'
```

#### DNF Commands

This file is just a small documentation for all the dnf commands that may be needed

```bash
  # All repos are stored in the following folder /etc/yum.repos.d and to delete any
  # one of them, just go to that folder and delete the one that is not required.
  # This commands is used to display all the repos currently being used by dnf
  dnf repolist
  
  # To refresh the repolist call the previous command with --refresh flag
  dnf repolist --refresh
  
  # To view how many packages are installed
  dnf list --installed
  
  # To view all the packages inside a repo
  dnf repo-pkgs <PACKAGE> list
```
